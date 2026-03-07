// Serve Excalidraw fonts locally to satisfy Nextcloud's CSP (font-src 'self')
window.EXCALIDRAW_ASSET_PATH = '/custom_apps/excalidraw/js/'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { Excalidraw, serializeAsJSON } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { registerFileAction, FileAction } from '@nextcloud/files'
import { getCurrentUser } from '@nextcloud/auth'

function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

function ExcalidrawEditor({ filePath, userId, onClose }) {
  const [initialData, setInitialData] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const webdavUrl = `/remote.php/dav/files/${encodeURIComponent(userId)}${filePath}`

  useEffect(() => {
    fetch(webdavUrl, {
      headers: { requesttoken: window.OC.requestToken },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load file (HTTP ${res.status})`)
        return res.text()
      })
      .then((text) => {
        const data = text.trim() ? JSON.parse(text) : {}
        setInitialData({
          elements: data.elements || [],
          appState: data.appState || {},
          files: data.files || {},
        })
        setLoading(false)
      })
      .catch((err) => {
        setLoadError(err.message)
        setLoading(false)
      })
  }, [webdavUrl])

  const save = useCallback(
    async (elements, appState, files) => {
      setSaveStatus('saving')
      try {
        const json = serializeAsJSON(elements, appState, files, 'local')
        const res = await fetch(webdavUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            requesttoken: window.OC.requestToken,
          },
          body: json,
        })
        if (!res.ok) throw new Error(`Save failed (HTTP ${res.status})`)
        setSaveStatus('saved')
      } catch (err) {
        console.error('[excalidraw] save error:', err)
        setSaveStatus('error')
      }
    },
    [webdavUrl],
  )

  // Create a stable debounced save that wraps the latest `save` reference
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  }, [save])

  const debouncedSave = useRef(
    debounce((...args) => saveRef.current(...args), 2000),
  ).current

  // Track latest canvas state so we can flush a save on close
  const latestStateRef = useRef(null)
  const hasChangesRef = useRef(false)

  const handleClose = useCallback(async () => {
    if (hasChangesRef.current && latestStateRef.current) {
      const { elements, appState, files } = latestStateRef.current
      await saveRef.current(elements, appState, files)
    }
    onClose()
  }, [onClose])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: 'sans-serif',
          fontSize: 16,
          color: '#666',
        }}
      >
        Loading…
      </div>
    )
  }

  if (loadError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontFamily: 'sans-serif',
          gap: 12,
        }}
      >
        <p style={{ color: 'red', margin: 0 }}>Error: {loadError}</p>
        <button
          onClick={handleClose}
          style={{ padding: '6px 16px', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    )
  }

  const statusLabel = {
    idle: '',
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Save failed',
  }[saveStatus]

  const statusColor =
    saveStatus === 'error'
      ? 'var(--color-danger, #db6965)'
      : saveStatus === 'saved'
        ? 'var(--color-success-contrast, #65bb6a)'
        : 'var(--text-primary-color, #888)'

  return (
    <Excalidraw
      initialData={initialData}
      onChange={(elements, appState, files) => {
        latestStateRef.current = { elements, appState, files }
        hasChangesRef.current = true
        debouncedSave(elements, appState, files)
      }}
      UIOptions={{
        canvasActions: {
          saveToActiveFile: false,
          loadScene: false,
          export: false,
        },
      }}
      renderTopRightUI={() => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 8px',
          }}
        >
          {statusLabel && (
            <span
              style={{
                fontSize: 13,
                color: statusColor,
                fontFamily: 'inherit',
              }}
            >
              {statusLabel}
            </span>
          )}
          <button
            onClick={handleClose}
            style={{
              padding: '4px 12px',
              cursor: 'pointer',
              background: 'var(--button-bg, var(--island-bg-color))',
              border: '1px solid var(--default-border-color)',
              borderRadius: 4,
              fontSize: 13,
              lineHeight: '1.4',
              color: 'var(--text-primary-color)',
              fontFamily: 'inherit',
            }}
          >
            Close
          </button>
        </div>
      )}
    />
  )
}

function openExcalidrawEditor(filePath) {
  const user = getCurrentUser()
  if (!user) {
    console.error('[excalidraw] could not get current user')
    return
  }

  const overlay = document.createElement('div')
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#fff;display:flex;flex-direction:column;'
  document.body.appendChild(overlay)

  const styleEl = document.createElement('style')
  styleEl.textContent = `.excalidraw { --color-selection: #4dabf7 !important; }`
  document.head.appendChild(styleEl)

  const close = () => {
    root.unmount()
    overlay.remove()
    styleEl.remove()
  }

  const root = ReactDOM.createRoot(overlay)
  root.render(
    <ExcalidrawEditor filePath={filePath} userId={user.uid} onClose={close} />,
  )
}

registerFileAction(
  new FileAction({
    id: 'excalidraw-open',
    displayName: () => 'Edit with Excalidraw',
    iconSvgInline: () =>
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    enabled: (files) =>
      files.length === 1 && files[0].basename.endsWith('.excalidraw'),
    async exec(file) {
      openExcalidrawEditor(file.path)
      return null
    },
    default: 'default',
  }),
)
