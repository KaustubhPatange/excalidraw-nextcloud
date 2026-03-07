<?php

declare(strict_types=1);

namespace OCA\Excalidraw\Listeners;

use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;

/** @implements IEventListener<Event> */
class FilesLoadAdditionalScriptsListener implements IEventListener {
	public function handle(Event $event): void {
		if (!$event instanceof LoadAdditionalScriptsEvent) {
			return;
		}

		\OCP\Util::addScript('excalidraw', 'fileaction');
		\OC::$server->get(\Psr\Log\LoggerInterface::class)->info(
			'[excalidraw] FilesLoadAdditionalScriptsListener fired, script registered',
			['app' => 'excalidraw']
		);
	}
}
