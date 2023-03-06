DROP DATABASE IF EXISTS `CryptoDashboard`;
CREATE DATABASE `CryptoDashboard` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `CoinCurrency`;
CREATE TABLE `CoinCurrency` (
  `coinCurrencyID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrency` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`coinCurrencyID`),
  UNIQUE KEY `coinCurrency_UNIQUE` (`coinCurrency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `CoinCurrency` (coinCurrencyID, coinCurrency) VALUES (1, `BTC`);
INSERT INTO `CoinCurrency` (coinCurrencyID, coinCurrency) VALUES (2, `ETH`);
INSERT INTO `CoinCurrency` (coinCurrencyID, coinCurrency) VALUES (3, `SOL`);

DROP TABLE IF EXISTS `Exchange`;
CREATE TABLE `Exchange` (
  `exchangeID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `exchange` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`exchangeID`),
  UNIQUE KEY `exchange_UNIQUE` (`exchange`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Exchange` (exchangeID, exchange) VALUES (1, `Bybit`);
INSERT INTO `Exchange` (exchangeID, exchange) VALUES (2, `Binance`);
INSERT INTO `Exchange` (exchangeID, exchange) VALUES (3, `Bit.com`);
INSERT INTO `Exchange` (exchangeID, exchange) VALUES (4, `Deribit`);
INSERT INTO `Exchange` (exchangeID, exchange) VALUES (5, `OKEX`);

DROP TABLE IF EXISTS `Contracts_Traded_Binance`;
CREATE TABLE `Contracts_Traded_Binance` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `instrumentID` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tradeID` int(10) unsigned NOT NULL,
  `tradeTime` timestamp NULL DEFAULT NULL,
  `price` decimal(20,5) unsigned NOT NULL,
  `indexPrice` decimal(20,5) unsigned DEFAULT NULL,
  `markPrice` decimal(20,5) unsigned DEFAULT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `buyerOrderID` bigint(20) unsigned NOT NULL,
  `sellerOrderID` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `CTBinance_coinCurrencyID_fk_idx` (`coinCurrencyID`),
  CONSTRAINT `CTBinance_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Contracts_Traded_Bitcom`;
CREATE TABLE `Contracts_Traded_Bitcom` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `instrumentID` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tradeID` int(10) unsigned NOT NULL,
  `tradeTime` timestamp NULL DEFAULT NULL,
  `price` decimal(20,5) unsigned NOT NULL,
  `indexPrice` decimal(20,5) unsigned DEFAULT NULL,
  `markPrice` decimal(20,5) unsigned DEFAULT NULL,
  `quantity` decimal(20,5) unsigned NOT NULL,
  `side` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `CTBitcom_coinCurrencyID_fk_idx` (`coinCurrencyID`),
  CONSTRAINT `CTBitcom_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Contracts_Traded_Bybit`;
CREATE TABLE `Contracts_Traded_Bybit` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `instrumentID` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tradeID` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tradeTime` timestamp NULL DEFAULT NULL,
  `direction` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `positionQuantity` decimal(20,5) unsigned NOT NULL,
  `orderPrice` decimal(20,5) unsigned NOT NULL,
  `indexPrice` decimal(20,5) unsigned DEFAULT NULL,
  `markPrice` decimal(20,5) unsigned DEFAULT NULL,
  `priceChangeDirection` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isBlockTrade` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `CTBybit_coinCurrencyID_fk_idx` (`coinCurrencyID`),
  CONSTRAINT `CTBybit_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Contracts_Traded_Deribit`;
CREATE TABLE `Contracts_Traded_Deribit` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `instrumentID` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tradeID` int(10) unsigned NOT NULL,
  `tradeTime` timestamp NULL DEFAULT NULL,
  `tickDirection` int(10) unsigned NOT NULL,
  `price` decimal(20,5) unsigned NOT NULL,
  `markPrice` decimal(20,5) unsigned NOT NULL,
  `iv` decimal(20,5) unsigned NOT NULL,
  `instrumentName` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `indexPrice` decimal(20,5) unsigned NOT NULL,
  `direction` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(20,5) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `CTDeribit_coinCurrencyID_fk_idx` (`coinCurrencyID`),
  CONSTRAINT `CTDeribit_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Contracts_Traded_Okex`;
CREATE TABLE `Contracts_Traded_Okex` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `tradeID` int(10) unsigned NOT NULL,
  `tradeTime` timestamp NULL DEFAULT NULL,
  `instrumentID` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instrumentFamily` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(20,5) unsigned NOT NULL,
  `quantity` decimal(20,5) unsigned NOT NULL,
  `side` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `optionType` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fillVol` decimal(20,16) unsigned NOT NULL,
  `forwardPrice` decimal(20,12) unsigned NOT NULL,
  `indexPrice` decimal(20,5) unsigned NOT NULL,
  `markPrice` decimal(20,16) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `CTBitcom_coinCurrencyID_fk_idx` (`coinCurrencyID`),
  CONSTRAINT `CTOkex_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Expiry_Binance`;
CREATE TABLE `Expiry_Binance` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `ts` timestamp NOT NULL,
  `expiry` date NOT NULL,
  `strike` int(10) unsigned NOT NULL,
  `callOrPut` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tradingVolume` decimal(20,5) unsigned NOT NULL,
  `openInterest` decimal(20,5) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `coinCurrencyID_idx` (`coinCurrencyID`),
  KEY `ts_idx` (`ts`),
  KEY `expiry_idx` (`expiry`),
  KEY `strike_idx` (`strike`),
  CONSTRAINT `ExpBinance_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Expiry_Bitcom`;
CREATE TABLE `Expiry_Bitcom` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `ts` timestamp NOT NULL,
  `expiry` date NOT NULL,
  `strike` int(10) unsigned NOT NULL,
  `callOrPut` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tradingVolume` decimal(20,5) unsigned NOT NULL,
  `openInterest` decimal(20,5) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `coinCurrencyID_idx` (`coinCurrencyID`),
  KEY `ts_idx` (`ts`),
  KEY `expiry_idx` (`expiry`),
  KEY `strike_idx` (`strike`),
  CONSTRAINT `ExpBitcom_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Expiry_Bybit`;
CREATE TABLE `Expiry_Bybit` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `ts` timestamp NOT NULL,
  `expiry` date NOT NULL,
  `strike` int(10) unsigned NOT NULL,
  `callOrPut` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tradingVolume` decimal(20,5) unsigned NOT NULL,
  `openInterest` decimal(20,5) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `coinCurrencyID_idx` (`coinCurrencyID`),
  KEY `ts_idx` (`ts`),
  KEY `expiry_idx` (`expiry`),
  KEY `strike_idx` (`strike`),
  CONSTRAINT `ExpBybit_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Expiry_Deribit`;
CREATE TABLE `Expiry_Deribit` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `ts` timestamp NOT NULL,
  `expiry` date NOT NULL,
  `strike` int(10) unsigned NOT NULL,
  `callOrPut` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tradingVolume` decimal(20,5) unsigned NOT NULL,
  `openInterest` decimal(20,5) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `coinCurrencyID_idx` (`coinCurrencyID`),
  KEY `ts_idx` (`ts`),
  KEY `expiry_idx` (`expiry`),
  KEY `strike_idx` (`strike`),
  CONSTRAINT `ExpDeribit_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Expiry_Okex`;
CREATE TABLE `Expiry_Okex` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `ts` timestamp NOT NULL,
  `expiry` date NOT NULL,
  `strike` int(10) unsigned NOT NULL,
  `callOrPut` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tradingVolume` decimal(20,5) unsigned NOT NULL,
  `openInterest` decimal(20,5) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `coinCurrencyID_idx` (`coinCurrencyID`),
  KEY `ts_idx` (`ts`),
  KEY `expiry_idx` (`expiry`),
  KEY `strike_idx` (`strike`),
  CONSTRAINT `ExpOkex_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Open_Interest`;
CREATE TABLE `Open_Interest` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `exchangeID` int(10) unsigned NOT NULL,
  `ts` timestamp NOT NULL,
  `value` decimal(20,5) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `ts_idx` (`ts`),
  KEY `OI_coinCurrencyID_fk_idx` (`coinCurrencyID`),
  KEY `OI_exchangeID_fk_idx` (`exchangeID`),
  CONSTRAINT `OI_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `OI_exchangeID_fk` FOREIGN KEY (`exchangeID`) REFERENCES `Exchange` (`exchangeID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Volume_Notional`;
CREATE TABLE `Volume_Notional` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `exchangeID` int(10) unsigned NOT NULL,
  `ts` timestamp NOT NULL,
  `value` decimal(20,5) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `ts_idx` (`ts`),
  KEY `VN_coinCurrencyID_fk_idx` (`coinCurrencyID`),
  KEY `VN_exchangeID_fk_idx` (`exchangeID`),
  CONSTRAINT `VN_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `VN_exchangeID_fk` FOREIGN KEY (`exchangeID`) REFERENCES `Exchange` (`exchangeID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `Volume_Premium`;
CREATE TABLE `Volume_Premium` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coinCurrencyID` int(10) unsigned NOT NULL,
  `exchangeID` int(10) unsigned NOT NULL,
  `ts` timestamp NOT NULL,
  `value` decimal(20,5) unsigned NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `VP_coinCurrencyID_fk_idx` (`coinCurrencyID`),
  KEY `VP_exchangeID_fk_idx` (`exchangeID`),
  KEY `ts_idx` (`ts`),
  CONSTRAINT `VP_coinCurrencyID_fk` FOREIGN KEY (`coinCurrencyID`) REFERENCES `CoinCurrency` (`coinCurrencyID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `VP_exchangeID_fk` FOREIGN KEY (`exchangeID`) REFERENCES `Exchange` (`exchangeID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
