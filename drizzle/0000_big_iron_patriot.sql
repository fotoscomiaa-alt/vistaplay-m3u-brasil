CREATE TABLE `playlist_channel_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`url` text NOT NULL,
	`publishedByOfficial` boolean NOT NULL DEFAULT false,
	`enabled` boolean NOT NULL DEFAULT true,
	`status` enum('online','offline','pending') NOT NULL DEFAULT 'pending',
	`lastCheckedAt` timestamp,
	`lastHttpStatus` int,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playlist_channel_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playlist_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`category` varchar(100) NOT NULL,
	`groupTitle` varchar(140) NOT NULL,
	`tvgId` varchar(180),
	`logoUrl` text,
	`officialPageUrl` text NOT NULL,
	`status` enum('online','offline','official_page_only','pending') NOT NULL DEFAULT 'pending',
	`enabled` boolean NOT NULL DEFAULT true,
	`lastCheckedAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playlist_channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `playlist_channels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `playlist_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trigger` varchar(80) NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	`checkedCount` int NOT NULL DEFAULT 0,
	`onlineCount` int NOT NULL DEFAULT 0,
	`offlineCount` int NOT NULL DEFAULT 0,
	`pageOnlyCount` int NOT NULL DEFAULT 0,
	`notes` text,
	CONSTRAINT `playlist_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
