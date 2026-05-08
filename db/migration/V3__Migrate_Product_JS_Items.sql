-- 迁移 product.js 中的硬编码商品数据到 items 表
-- 注意: seller_id 需要替换为实际存在的用户ID

INSERT INTO items (item_id, seller_id, title, description, price, category, status, location, views, quality, is_urgent, is_free_shipping, can_inspect, created_at, updated_at) VALUES
(1, (SELECT user_id FROM users LIMIT 1), '正版教材低至1折 高等数学同济版+线性代数', '全新未拆封 考完用不上了', 5.00, '教材书籍', 'available', '校内', 256, 95, false, true, false, NOW(), NOW()),

(UUID(), (SELECT user_id FROM users LIMIT 1), '索尼WH-1000XM4 头戴式降噪耳机', '九成新 送原装收纳盒', 120.00, '数码设备', 'available', '校内', 183, 90, false, false, true, NOW(), NOW()),

(UUID(), (SELECT user_id FROM users LIMIT 1), '泡泡玛特 MOLLY 系列盲盒手办', '确认款 非隐藏 带包装', 29.00, '潮玩手办', 'available', '校内', 412, 100, false, true, false, NOW(), NOW()),

(UUID(), (SELECT user_id FROM users LIMIT 1), '星巴克中杯券×3 瑞幸9.9折扣券×5', '有效期到下月底 低价出', 1.50, '优惠卡券', 'available', '校内', 678, 100, true, true, false, NOW(), NOW()),

(UUID(), (SELECT user_id FROM users LIMIT 1), '尤尼克斯羽毛球拍 ARC-7 弓箭7', '八成新 送手胶和球包', 35.00, '运动器材', 'available', '校内', 95, 80, false, false, true, NOW(), NOW()),

(UUID(), (SELECT user_id FROM users LIMIT 1), '宿舍小台灯 LED护眼 三档调光', '用了一学期 功能完好', 8.00, '生活日用', 'available', '校内', 67, 85, false, false, false, NOW(), NOW());
