CREATE TABLE `account_orders` (
  `id` varchar(255) NOT NULL,
  `instance_id` int(10) NOT NULL DEFAULT '0',
  `time` bigint(20) NOT NULL DEFAULT '0',
  `timestamp` bigint(20) DEFAULT NULL,
  `datetime` varchar(255) DEFAULT NULL,
  `lastTradeTimestamp` bigint(20) DEFAULT NULL,
  `symbol` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `side` varchar(255) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `amount` double DEFAULT NULL,
  `cost` double DEFAULT NULL,
  `average` double DEFAULT NULL,
  `filled` double DEFAULT NULL,
  `remaining` double DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `fee` double DEFAULT NULL,
  `trades` int(10) DEFAULT NULL,
  `info` json DEFAULT NULL,
  `closed` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE `account_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`,`time`,`closed`);
COMMIT;