<?php

declare(strict_types=1);

namespace OCA\Excalidraw\AppInfo;

use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCA\Excalidraw\Listeners\FilesLoadAdditionalScriptsListener;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;

class Application extends App implements IBootstrap {
	public const APPNAME = 'excalidraw';

	public function __construct() {
		parent::__construct(self::APPNAME);
	}

	public function register(IRegistrationContext $context): void {
		$context->registerEventListener(
			LoadAdditionalScriptsEvent::class,
			FilesLoadAdditionalScriptsListener::class
		);
	}

	public function boot(IBootContext $context): void {
	}
}
