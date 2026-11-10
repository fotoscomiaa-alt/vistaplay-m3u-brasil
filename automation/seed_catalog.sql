INSERT INTO playlist_channels (name, slug, category, groupTitle, tvgId, officialPageUrl, status, enabled) VALUES
('Globo', 'globo', 'Globo', 'Canais | Globo', 'globo.br', 'https://globoplay.globo.com/tv-globo/ao-vivo/7832875/', 'official_page_only', true),
('SBT', 'sbt', 'SBT', 'Canais | SBT', 'sbt.br', 'https://www.sbt.com.br/ao-vivo', 'official_page_only', true),
('Record TV', 'record-tv', 'Record TV', 'Canais | Record TV', 'record.br', 'https://www.recordplus.com/live', 'official_page_only', true),
('Band', 'band', 'Band', 'Canais | Band', 'band.br', 'https://www.band.com.br/ao-vivo/band-nacional', 'official_page_only', true),
('RedeTV!', 'redetv', 'RedeTV!', 'Canais | RedeTV!', 'redetv.br', 'https://www.redetv.uol.com.br/aovivo', 'pending', true),
('TV Cultura', 'tv-cultura', 'TV Cultura', 'Canais | TV Cultura', 'tvcultura.br', 'https://tvcultura.com.br/aovivo/', 'official_page_only', true),
('TV Brasil', 'tv-brasil', 'TV Brasil', 'Canais | TV Brasil', 'tvbrasil.br', 'https://tvbrasil.ebc.com.br/webtv/', 'official_page_only', true),
('TV Câmara', 'tv-camara', 'TV Câmara', 'Canais | TV Câmara', 'tvcamara.br', 'https://www.camara.leg.br/tv', 'official_page_only', true),
('TV Senado', 'tv-senado', 'TV Senado', 'Canais | TV Senado', 'tvsenado.br', 'https://www12.senado.leg.br/tv/programas/ao-vivo', 'official_page_only', true),
('Canal Gov', 'canal-gov', 'TV Brasil', 'Canais | TV Brasil', 'canalgov.br', 'https://canalgov.ebc.com.br/ao-vivo', 'official_page_only', true)
ON DUPLICATE KEY UPDATE name=VALUES(name), officialPageUrl=VALUES(officialPageUrl), updatedAt=NOW();

INSERT INTO playlist_channel_sources (channelId, label, url, publishedByOfficial, enabled, status)
SELECT id, 'RedeTV! oficial — sinal 1', 'https://evpp.mm.uol.com.br/redetv1/redetv1/playlist.m3u8', true, true, 'pending' FROM playlist_channels c WHERE c.slug='redetv' AND NOT EXISTS (SELECT 1 FROM playlist_channel_sources s WHERE s.channelId=c.id AND s.url='https://evpp.mm.uol.com.br/redetv1/redetv1/playlist.m3u8');
INSERT INTO playlist_channel_sources (channelId, label, url, publishedByOfficial, enabled, status)
SELECT id, 'RedeTV! oficial — sinal 2', 'https://evpp.mm.uol.com.br/redetv2/redetv2/playlist.m3u8', true, true, 'pending' FROM playlist_channels c WHERE c.slug='redetv' AND NOT EXISTS (SELECT 1 FROM playlist_channel_sources s WHERE s.channelId=c.id AND s.url='https://evpp.mm.uol.com.br/redetv2/redetv2/playlist.m3u8');
INSERT INTO playlist_channel_sources (channelId, label, url, publishedByOfficial, enabled, status)
SELECT id, 'RedeTV! oficial — CloudFront', 'https://d34hqvk9w7ng50.cloudfront.net/stream/index.m3u8', true, true, 'pending' FROM playlist_channels c WHERE c.slug='redetv' AND NOT EXISTS (SELECT 1 FROM playlist_channel_sources s WHERE s.channelId=c.id AND s.url='https://d34hqvk9w7ng50.cloudfront.net/stream/index.m3u8');
