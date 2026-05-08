// ========== Keyword → Product Seed Database ==========
var searchSeeds = {
    // ---- Phones/Digital/Computers ----
    'iPhone': [{ t: 'iPhone 15 Pro Max 256G Purple Titanium Dual SIM', p: 6200, e: '📱' }, { t: 'iPhone 14 128G Blue Battery 89% No Scratches', p: 3800, e: '📱' }, { t: 'iPhone 13 mini Pink 128G Lightly Used', p: 2600, e: '📱' }, { t: 'iPhone 12 64G White New Battery Smooth', p: 1800, e: '📱' }, { t: 'iPhone SE3 64G Red Great Backup Phone', p: 1200, e: '📱' }, { t: 'Apple Original 20W Charger+Cable Brand New Sealed', p: 65, e: '🔌' }],
    'Samsung Phone': [{ t: 'Samsung S24 Ultra 512G Titanium Gray w/ S Pen', p: 7500, e: '📱' }, { t: 'Samsung S23 256G Green Perfect Screen', p: 3900, e: '📱' }, { t: 'Samsung Z Flip5 Foldable Lavender 256G', p: 4200, e: '📱' }, { t: 'Samsung A54 128G White Student Backup', p: 1100, e: '📱' }],
    'Huawei Phone': [{ t: 'Huawei Mate60 Pro 512G Black Satellite Calling', p: 5800, e: '📱' }, { t: 'Huawei P60 Pro 256G White Kunlun Glass', p: 3600, e: '📱' }, { t: 'Huawei nova12 256G Pink Great for Selfies', p: 1800, e: '📱' }, { t: 'Huawei Mate50 256G Gold Good Condition', p: 2800, e: '📱' }],
    'Xiaomi Phone': [{ t: 'Xiaomi 14 Pro 512G White Leica Camera', p: 3200, e: '📱' }, { t: 'Xiaomi 13 256G Black Snapdragon 8 Gen2', p: 2100, e: '📱' }, { t: 'Redmi K70 Pro 256G White Performance Beast', p: 1800, e: '📱' }, { t: 'Xiaomi Civi3 256G Mint Green Personal Use', p: 1200, e: '📱' }],
    'OnePlus': [{ t: 'OnePlus 12 16+512 Black Hasselblad Camera', p: 3000, e: '📱' }, { t: 'OnePlus Ace3 16+256 Gold Long Battery', p: 1500, e: '📱' }],
    'Honor Phone': [{ t: 'Honor Magic6 Pro 512G Cyan', p: 3500, e: '📱' }, { t: 'Honor 100 Pro 256G Blue', p: 1800, e: '📱' }],
    'OPPO Phone': [{ t: 'OPPO Find X7 Ultra 16+512 Sky Blue', p: 4200, e: '📱' }, { t: 'OPPO Reno11 Pro 256G Moonstone', p: 1600, e: '📱' }],
    'vivo Phone': [{ t: 'vivo X100 Pro 16+512 Orange Zeiss Camera', p: 3500, e: '📱' }, { t: 'vivo S18 Pro 256G Floral', p: 1800, e: '📱' }],
    'iQOO': [{ t: 'iQOO 12 16+256 Legend Edition Gaming Flagship', p: 2500, e: '📱' }, { t: 'iQOO Neo9 Pro 256G Red White', p: 1800, e: '📱' }],
    'realme': [{ t: 'realme GT5 Pro 16+256 Black', p: 1800, e: '📱' }, { t: 'realme GT Neo5 SE 256G', p: 900, e: '📱' }],
    'Redmi Phone': [{ t: 'Redmi Note 13 Pro+ 256G Purple', p: 1100, e: '📱' }, { t: 'Redmi 13C 128G Black Backup Phone', p: 500, e: '📱' }],
    'Meizu': [{ t: 'Meizu 21 16+512 White Flyme System', p: 2200, e: '📱' }],
    'ZTE': [{ t: 'ZTE Axon60 Ultra 1TB Black Massive Storage', p: 3000, e: '📱' }],
    'Nubia': [{ t: 'Nubia Z60 Ultra 16+512 Photography Flagship', p: 2800, e: '📱' }],
    'Laptop': [{ t: 'MacBook Air M2 15" 16+512 Space Gray', p: 7200, e: '💻' }, { t: 'Lenovo IdeaPad Pro 16 R7-7840HS 16+512', p: 3500, e: '💻' }, { t: 'ThinkPad X1 Carbon Gen11 i7 32G', p: 6800, e: '💻' }, { t: 'Huawei MateBook 14s i5 16+512', p: 3800, e: '💻' }],
    'Tablet': [{ t: 'iPad Pro M2 11" 256G WiFi Space Gray', p: 4500, e: '📱' }, { t: 'iPad Air5 64G WiFi Blue w/ Pencil', p: 2800, e: '📱' }, { t: 'Huawei MatePad Pro 11 256G', p: 2200, e: '📱' }, { t: 'Xiaomi Pad 6 Pro 256G Gold', p: 1500, e: '📱' }],
    'Gaming Laptop': [{ t: 'Lenovo Legion Y9000P i9+RTX4060 16+512', p: 5500, e: '💻' }, { t: 'ASUS TUF Gaming R9+RTX4060', p: 4800, e: '💻' }],
    'Desktop PC': [{ t: 'Custom PC i5-13600K+RTX4070 32G', p: 5000, e: '🖥️' }, { t: 'Mac Mini M2 16+256 Silver Like New', p: 3200, e: '🖥️' }],
    'Bluetooth Earbuds': [{ t: 'AirPods Pro 2 USB-C AppleCare til Next Year', p: 1100, e: '🎧' }, { t: 'Sony WH-1000XM5 Over-ear ANC Platinum Silver', p: 1500, e: '🎧' }, { t: 'Sony WF-1000XM5 True Wireless ANC Black', p: 900, e: '🎧' }, { t: 'Huawei FreeBuds Pro 3 Ceramic White', p: 650, e: '🎧' }, { t: 'Bose QC45 Over-ear ANC Black 90% New', p: 1200, e: '🎧' }],
    'Wired Earphones': [{ t: 'Sennheiser IE600 In-ear HiFi w/ Case', p: 2200, e: '🎧' }, { t: 'Audio-Technica ATH-M50x Studio Monitor Black', p: 550, e: '🎧' }],
    'Speaker': [{ t: 'JBL Flip6 Bluetooth Speaker Red Waterproof', p: 450, e: '🔊' }, { t: 'Harman Kardon Aura Studio 4 Desktop Black', p: 800, e: '🔊' }],
    'Power Bank': [{ t: 'Xiaomi Power Bank 20000mAh 50W Fast Charge New', p: 120, e: '🔋' }, { t: 'Anker 65W Power Bank 24000mAh Laptop Compatible', p: 280, e: '🔋' }],
    'Projector': [{ t: 'XGIMI H5 Projector 1080P Auto Focus', p: 2800, e: '📽️' }, { t: 'JMGO N1 Ultra 4K Laser Projector Like New', p: 4500, e: '📽️' }],
    'Portable SSD': [{ t: 'Samsung T7 1TB Portable SSD Blue', p: 450, e: '💾' }, { t: 'WD 2TB Portable HDD USB3.0 Black', p: 280, e: '💾' }],
    'USB Drive': [{ t: 'SanDisk 256G USB3.2 Read 400MB/s', p: 89, e: '💾' }, { t: 'Samsung 128G USB-C+USB Dual Interface', p: 55, e: '💾' }],
    'Smartwatch': [{ t: 'Apple Watch S9 45mm GPS Midnight', p: 2200, e: '⌚' }, { t: 'Huawei Watch GT4 46mm Brown Leather', p: 900, e: '⌚' }],
    'Fitness Band': [{ t: 'Xiaomi Band 8 NFC w/ Extra Straps', p: 95, e: '⌚' }, { t: 'Huawei Band 8 NFC Pink', p: 150, e: '⌚' }],
    'Mirrorless Camera': [{ t: 'Sony A7M4 Body Only 20K Shutter Count w/ Box', p: 12000, e: '📷' }, { t: 'Fujifilm X-T5 Silver w/ XF35/1.4', p: 9500, e: '📷' }],
    'DSLR Camera': [{ t: 'Canon 5D4 Body Only 50K Shutter Good Condition', p: 8500, e: '📷' }, { t: 'Nikon D850 Body Only 30K Shutter', p: 9000, e: '📷' }],
    'Mechanical Keyboard': [{ t: 'Custom Keyboard Gateron G Yellow Pro Aluminum', p: 320, e: '⌨️' }, { t: 'Cherry MX Board 3.0S Red Switch White', p: 280, e: '⌨️' }, { t: 'Keychron K2 Pro Brown Switch Bluetooth Tri-mode', p: 350, e: '⌨️' }],
    'Mouse': [{ t: 'Logitech G502 X PLUS Wireless Gaming Mouse', p: 450, e: '🖱️' }, { t: 'Logitech MX Master 3S Office Mouse Gray', p: 380, e: '🖱️' }],
    'Monitor': [{ t: 'Dell U2723QE 4K 27" Type-C 90W', p: 2500, e: '🖥️' }, { t: 'LG 27GP850 2K 165Hz Gaming Monitor', p: 1800, e: '🖥️' }],
    'Graphics Card': [{ t: 'RTX 4070 Ti GALAX HOF OC Brand New Warranty', p: 3800, e: '🎮' }, { t: 'RTX 3060 12G MSI Ventus Lightly Used', p: 1200, e: '🎮' }],
    // ---- Clothing/Bags/Sports ----
    'Dress': [{ t: 'Floral Dress French Vintage Size S Worn Once', p: 45, e: '👗' }, { t: 'Black Strap Dress Slim A-line Size M Brand New', p: 55, e: '👗' }],
    'T-Shirt': [{ t: 'Uniqlo x KAWS UT Collab White Size L', p: 35, e: '👕' }, { t: 'Champion Script Logo Tee Black Size M', p: 40, e: '👕' }],
    'Hoodie': [{ t: 'Nike Big Swoosh Hoodie Gray Oversized Size L', p: 120, e: '👕' }, { t: 'Stussy 8-Ball Hoodie Black Size M 90% New', p: 180, e: '👕' }],
    'Jacket': [{ t: 'Uniqlo Fleece Jacket Navy XL Warm', p: 60, e: '🧥' }, { t: 'The North Face Shell Jacket Black M Waterproof', p: 450, e: '🧥' }],
    'Jeans': [{ t: 'Levis 501 Classic Straight Dark Blue Size 30', p: 120, e: '👖' }, { t: 'Lee High-waist Wide Leg Light Blue Size 26', p: 80, e: '👖' }],
    'Sneakers': [{ t: 'Nike Air Force 1 White Size 9 80% New', p: 250, e: '👟' }, { t: 'New Balance 990v5 Gray Size 9.5', p: 500, e: '👟' }, { t: 'Adidas Ultraboost 22 Black Size 9', p: 350, e: '👟' }],
    'Canvas Shoes': [{ t: 'Converse 1970s High Top Black Size 8 Classic', p: 180, e: '👟' }, { t: 'Vans Old Skool Black/White Size 9', p: 120, e: '👟' }],
    'Backpack': [{ t: 'The North Face Borealis Backpack Black 28L', p: 250, e: '🎒' }, { t: 'Xiaomi City Commuter Backpack Gray Water-resistant', p: 80, e: '🎒' }],
    'Luggage': [{ t: 'Samsonite 20" Carry-on Black Spinner TSA Lock', p: 600, e: '🧳' }, { t: 'Xiaomi Suitcase 24" Silver Brand New', p: 250, e: '🧳' }],
    'Watch': [{ t: 'Casio G-Shock GA-2100 CasiOak Black', p: 450, e: '⌚' }, { t: 'DW Classic Black Dial Leather 40mm Mens', p: 350, e: '⌚' }],
    'Running Shoes': [{ t: 'Li-Ning Feidian 3 Size 9 200km Mileage', p: 280, e: '👟' }, { t: 'ASICS Gel-Nimbus 25 Gray Size 9.5', p: 400, e: '👟' }],
    'Basketball Shoes': [{ t: 'Nike Kobe 6 All-Star Size 9', p: 800, e: '👟' }, { t: 'Li-Ning YuShuai 16 White Size 9.5 Great for Play', p: 350, e: '👟' }],
    // ---- Gaming/Vouchers/Collectibles ----
    'Switch': [{ t: 'Switch OLED Japanese White w/ Ring Fit', p: 1500, e: '🎮' }, { t: 'Switch Lite Coral Pink w/ Case', p: 650, e: '🎮' }],
    'PS5': [{ t: 'PS5 Disc Edition w/ Two Controllers', p: 2800, e: '🎮' }, { t: 'PS5 Digital Edition w/ God of War', p: 2500, e: '🎮' }],
    'Steam Deck': [{ t: 'Steam Deck 512G w/ Case and Dock', p: 2800, e: '🎮' }],
    'Switch Games': [{ t: 'Zelda Tears of the Kingdom Physical Cart', p: 200, e: '🎮' }, { t: 'Mario Odyssey + Party Bundle 2 Games', p: 250, e: '🎮' }],
    'Coffee Voucher': [{ t: 'Starbucks Grande Latte Voucher x3 Expires Next Month', p: 45, e: '☕' }, { t: 'Local Cafe Voucher x5 Any Location', p: 50, e: '☕' }],
    'Food Delivery Coupon': [{ t: 'Food Delivery $15 off $30 Coupon x4', p: 20, e: '🛵' }, { t: 'Delivery App $5 No-minimum Coupon x6', p: 15, e: '🛵' }],
    'Movie Ticket': [{ t: 'AMC Double Feature Pass w/ Popcorn Combo', p: 68, e: '🎬' }, { t: 'Regal Cinema Voucher x2 Any Movie', p: 55, e: '🎬' }],
    'Streaming Sub': [{ t: 'Spotify Premium Annual Subscription Official', p: 88, e: '🎵' }, { t: 'Netflix Annual Plan Transferable', p: 98, e: '📺' }],
    'Pop Mart': [{ t: 'MOLLY Happy Train Series Confirmed Figure', p: 35, e: '🧸' }, { t: 'SKULLPANDA Temperature Series Secret Figure', p: 280, e: '🧸' }],
    'LEGO': [{ t: 'LEGO Technic Lamborghini Built w/ Display Case', p: 450, e: '🏎️' }, { t: 'LEGO Architecture Tokyo Tower Brand New Sealed', p: 180, e: '🧱' }],
    'Anime Figure': [{ t: 'Genshin Impact Zhongli 1/7 Scale New Sealed', p: 180, e: '⚔️' }, { t: 'One Piece Luffy Gear 4 GK w/ LED Base', p: 320, e: '🏴‍☠️' }],
    'Blind Box': [{ t: 'Pop Mart DIMOO World Tour Full Set of 12', p: 450, e: '🎁' }, { t: 'Finding Unicorn Farmer Bob Confirmed', p: 39, e: '🎁' }],
    'Board Game': [{ t: 'Catan 10th Anniversary Edition New Sealed', p: 120, e: '🃏' }, { t: 'Catan Base + Seafarers Expansion Bundle', p: 65, e: '🃏' }],
    // ---- Textbooks/Study Materials ----
    'Calculus': [{ t: 'Calculus Early Transcendentals 8th Ed Like New', p: 15, e: '📘' }, { t: 'Calculus Study Guide 2024 Edition', p: 20, e: '📘' }],
    'Physics': [{ t: 'University Physics Vol 1&2 + Solutions Manual', p: 20, e: '📕' }, { t: 'Physics Lab Manual w/ Lab Reports', p: 8, e: '📕' }],
    'Linear Algebra': [{ t: 'Linear Algebra 6th Ed Light Pencil Notes', p: 8, e: '📗' }, { t: 'Linear Algebra Study Guide w/ Solutions', p: 15, e: '📗' }],
    'C Programming': [{ t: 'C Programming Language K&R 2nd Ed 90% New', p: 5, e: '📓' }, { t: 'C Primer Plus 6th Edition', p: 25, e: '📓' }],
    'Data Structures': [{ t: 'Data Structures & Algorithms in C w/ Answers', p: 9, e: '📚' }, { t: 'Grokking Algorithms Illustrated Guide', p: 12, e: '📚' }],
    'GRE Prep': [{ t: 'GRE Official Guide 2015-2024 Practice Tests', p: 25, e: '📙' }, { t: 'GRE Verbal & Quant Prep Bundle', p: 20, e: '📙' }],
    'Math Prep': [{ t: 'Advanced Math 18 Lectures + 1000 Problems 2025', p: 35, e: '📘' }, { t: 'Math Practice Test Complete Solutions', p: 28, e: '📘' }],
    'Test Prep': [{ t: 'Practice Exam 4-Pack + 8-Pack 2025 Brand New', p: 30, e: '📕' }, { t: 'Comprehensive Review + 1000 Questions', p: 25, e: '📕' }],
    'TOEFL/IELTS': [{ t: 'TOEFL Practice Tests Bundle 5 Books', p: 15, e: '📗' }, { t: 'IELTS Cambridge Tests 14-18 Five Books', p: 60, e: '📗' }],
    'IELTS': [{ t: 'Cambridge IELTS 14-18 Five Book Bundle', p: 60, e: '📙' }, { t: 'IELTS Vocabulary + Writing Samples', p: 25, e: '📙' }],
    'Programming Books': [{ t: 'Introduction to Algorithms 3rd Ed w/ Notes', p: 35, e: '📚' }, { t: 'Computer Systems: A Programmers Perspective 3rd', p: 40, e: '📚' }],
    // ---- Furniture/Appliances/Daily ----
    'Desk': [{ t: 'IKEA Desk White 120x60cm w/ Drawer', p: 150, e: '🪑' }, { t: 'Electric Standing Desk White 120cm', p: 450, e: '🪑' }],
    'Chair': [{ t: 'Ergonomic Mesh Chair Adjustable Lumbar & Arms', p: 350, e: '🪑' }, { t: 'IKEA Office Chair Black w/ Wheels', p: 80, e: '🪑' }],
    'Desk Lamp': [{ t: 'LED Eye-care Desk Lamp 3 Modes USB Charging', p: 25, e: '💡' }, { t: 'Xiaomi Desk Lamp 1S Smart Dimming White', p: 55, e: '💡' }],
    'Fan': [{ t: 'Xiaomi Desktop Fan Silent 3-speed', p: 20, e: '🌀' }, { t: 'Dyson AM06 Bladeless Fan White Silver', p: 800, e: '🌀' }],
    'Mini Fridge': [{ t: 'Xiaomi Mini Fridge 45L Single Door White', p: 250, e: '🧊' }, { t: 'Haier Mini Fridge 93L Double Door Silver', p: 380, e: '🧊' }],
    'Storage Box': [{ t: 'Storage Boxes x3 Foldable Clear S/M/L Set', p: 15, e: '📦' }, { t: 'MUJI PP Storage Boxes 6-pack Bundle', p: 30, e: '📦' }],
    'Hangers': [{ t: 'Hangers x30 Stainless Steel Non-slip Moving Sale', p: 8, e: '🪝' }, { t: 'Wooden Hangers x10 Thick Non-slip Brand New', p: 25, e: '🪝' }],
    'Electric Kettle': [{ t: 'Xiaomi Smart Kettle 1.5L White', p: 45, e: '🫖' }, { t: 'Portable Folding Electric Kettle Travel Size', p: 35, e: '🫖' }],
    // ---- Beauty/Skincare/Personal Care ----
    'Lipstick': [{ t: 'MAC Bullet Lipstick Chili Brand New Sealed', p: 95, e: '💄' }, { t: 'YSL Rouge Pur Couture #21 Used Twice', p: 120, e: '💄' }],
    'Foundation': [{ t: 'Estee Lauder Double Wear 1W1 Long-lasting', p: 180, e: '💄' }, { t: 'Armani Luminous Silk #4 Brand New', p: 220, e: '💄' }],
    'Face Mask': [{ t: 'SK-II Facial Treatment Mask x6 Authentic', p: 280, e: '🧴' }, { t: 'Honey Sheet Masks 2 Boxes 20pcs Brand New', p: 45, e: '🧴' }],
    'Sunscreen': [{ t: 'Anessa Perfect UV 60ml New Sealed', p: 120, e: '🧴' }, { t: 'La Roche-Posay Anthelios 50ml Sensitive Skin', p: 55, e: '🧴' }],
    'Electric Toothbrush': [{ t: 'Philips Sonicare HX6856 Pink', p: 180, e: '🪥' }, { t: 'Oral-B iO Series 5 White Brand New', p: 95, e: '🪥' }],
    'Perfume': [{ t: 'Jo Malone Wild Bluebell 100ml w/ Box Barely Used', p: 350, e: '🌸' }, { t: 'Versace Bright Crystal 50ml Brand New', p: 120, e: '🌸' }],
    // ---- Instruments/Stationery/Crafts ----
    'Acoustic Guitar': [{ t: 'Yamaha F310 Acoustic Guitar 90% New w/ Bag', p: 450, e: '🎸' }, { t: 'Fender CD-60S Solid Top Natural w/ Tuner', p: 350, e: '🎸' }],
    'Ukulele': [{ t: 'Kala Concert Ukulele 23" Mahogany w/ Bag', p: 120, e: '🎸' }, { t: 'Enya Nova U Carbon Fiber 26" Black', p: 280, e: '🎸' }],
    'Keyboard Piano': [{ t: 'Casio CT-S200 Keyboard 61-key White', p: 450, e: '🎹' }, { t: 'Yamaha PSR-E373 Keyboard w/ Stand', p: 650, e: '🎹' }],
    'Fountain Pen': [{ t: 'Pilot 78G+ Demonstrator Fine Nib w/ Cartridges', p: 45, e: '🖊️' }, { t: 'Lamy Safari Matte Black EF Nib', p: 80, e: '🖊️' }],
    'Markers': [{ t: 'Copic Markers 80-color Set w/ Case', p: 35, e: '🖊️' }, { t: 'Ohuhu Alcohol Markers 60-color Art Set', p: 45, e: '🖊️' }],
    'Colored Pencils': [{ t: 'Faber-Castell 48 Watercolor Pencils Tin Set', p: 55, e: '🎨' }, { t: 'Prismacolor Premier 72 Oil-based Set', p: 65, e: '🎨' }],
    // ---- Transportation/Rental/Other ----
    'Bicycle': [{ t: 'Giant ATX660 Mountain Bike 27-speed Blue', p: 600, e: '🚲' }, { t: 'Folding Bike 20" White Lightweight', p: 250, e: '🚲' }],
    'E-Bike': [{ t: 'NIU NQi Electric Scooter White 70km Range', p: 2200, e: '🛵' }, { t: 'Yadea E-bike Black w/ Helmet', p: 1500, e: '🛵' }],
    'Skateboard': [{ t: 'Pro Skateboard Maple Deck Adult Size', p: 120, e: '🛹' }, { t: 'Cruiser Board Street Commuter Blue', p: 55, e: '🛹' }],
    'Cat Food': [{ t: 'Orijen Six Fish Cat Food 5.4kg Sealed', p: 280, e: '🐱' }, { t: 'Royal Canin Kitten 10kg Bought Extra', p: 220, e: '🐱' }],
    'Cat Litter': [{ t: 'Mixed Cat Litter 6 Bags Bundle Tofu+Bentonite', p: 80, e: '🐱' }],
    'Plants': [{ t: 'Succulent Plants 10 Pots Bundle w/ Planters', p: 30, e: '🌱' }, { t: 'Monstera Large w/ Ceramic Pot', p: 45, e: '🌱' }],
    'Camera Rental': [{ t: 'Sony A7M3 Daily Rental w/ 24-70 Lens', p: 80, e: '📷' }],
    'Costume Rental': [{ t: 'Traditional Costume Full Set S/M/L Daily Rental', p: 50, e: '👘' }]
};

// ========== Fallback Seeds (used when no keyword match) ==========
var fallbackSeeds = [
    { t: 'Brand New Idle Item Low Price No Bargaining', p: 50, e: '📦' },
    { t: 'Moving Out Clearance Bundle Deals Available', p: 30, e: '🏠' },
    { t: 'Graduation Sale Prices Negotiable', p: 25, e: '🎓' },
    { t: 'Personal Item Good Condition Buy with Confidence', p: 80, e: '✨' },
    { t: 'Authentic Guaranteed Inspection Welcome', p: 120, e: '🛡️' },
    { t: 'Quick Sale Slightly Negotiable Serious Buyers Only', p: 60, e: '💰' }
];

// ========== Utility Functions ==========
var colors = [
    'from-rose-200 to-pink-300', 'from-sky-200 to-blue-300',
    'from-amber-200 to-orange-300', 'from-emerald-200 to-green-300',
    'from-violet-200 to-purple-300', 'from-cyan-200 to-teal-300',
    'from-red-200 to-rose-300', 'from-indigo-200 to-blue-300',
    'from-lime-200 to-green-300', 'from-fuchsia-200 to-pink-300'
];
var heights = ['h-44', 'h-48', 'h-52', 'h-56', 'h-60'];
var tagPool = [[], ['Free Shipping'], ['Brand New'], ['Inspectable'], ['Free Shipping', 'Brand New'], ['Official'], ['Quick Sale']];
var sellerAdj = ['Happy', 'Chill', 'Campus', 'Dorm', 'Studious', 'Grad', 'Friendly', 'Reliable', 'Honest', 'Casual'];
var sellerNoun = ['Student', 'Senior', 'Seller', 'Shop', 'Trader', 'Dealer', 'Pro', 'Gamer', 'Owner', 'Vendor'];

function randSeller() {
    return sellerAdj[Math.floor(Math.random() * sellerAdj.length)] + ' ' + sellerNoun[Math.floor(Math.random() * sellerNoun.length)];
}

function makeItem(seed) {
    var mul = 0.5 + Math.random() * 1.5;
    var p = Math.max(1, Math.round(seed.p * mul));
    var wants = Math.floor(Math.random() * 200) + 1;
    var views = wants + Math.floor(Math.random() * 300) + 50;
    return {
        id: 'sr_' + Date.now() + '_' + Math.floor(Math.random() * 99999),
        title: seed.t,
        highlightTitle: seed.highlightTitle || null,
        price: p,
        original: Math.round(p * (2 + Math.random() * 3)),
        emoji: seed.e,
        wants: wants,
        views: views,
        seller: randSeller(),
        tags: tagPool[Math.floor(Math.random() * tagPool.length)],
        time: Math.floor(Math.random() * 48) + 1
    };
}

// ========== Get Seed Data ==========
function getSeeds(keyword) {
    if (searchSeeds[keyword]) return searchSeeds[keyword];
    var keys = Object.keys(searchSeeds);
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].toLowerCase().indexOf(keyword.toLowerCase()) !== -1 || keyword.toLowerCase().indexOf(keys[i].toLowerCase()) !== -1) {
            return searchSeeds[keys[i]];
        }
    }
    return fallbackSeeds;
}

// ========== Highlight Keyword ==========
function highlightKeyword(text, keyword) {
    if (!keyword || !text) return text;
    var escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(' + escaped + ')', 'gi');
    return text.replace(regex, '<span class="text-red-500 font-bold">$1</span>');
}

// ========== Render Single Card ==========
function renderCard(grid, item, keyword) {
    var bg = colors[Math.floor(Math.random() * colors.length)];
    var h = heights[Math.floor(Math.random() * heights.length)];
    var tagHtml = item.tags.map(function (t) {
        return '<span class="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">' + t + '</span>';
    }).join(' ');
    var card = document.createElement('div');
    card.className = 'flex bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer';
    var highlightedTitle = item.highlightTitle ? item.highlightTitle : (keyword ? highlightKeyword(item.title, keyword) : item.title);
    card.innerHTML =
        '<div class="w-44 shrink-0 ' + h + ' bg-gradient-to-br ' + bg + ' flex items-center justify-center text-5xl relative">' +
        item.emoji +
        (tagHtml ? '<div class="absolute top-2 left-2 flex gap-1">' + tagHtml + '</div>' : '') +
        '</div>' +
        '<div class="flex-1 p-3 flex flex-col justify-between min-h-full">' +
        '<div>' +
        '<p class="text-sm text-gray-800 leading-snug line-clamp-2 font-medium">' + highlightedTitle + '</p>' +
        '</div>' +
        '<div class="mt-auto pt-2">' +
        '<div class="flex items-center gap-2">' +
        '<span class="text-orange-500 font-black text-lg">$' + item.price + '</span>' +
        '<span class="text-gray-400 line-through text-xs">$' + item.original + '</span>' +
        '</div>' +
        '<div class="flex items-center justify-between mt-1.5">' +
        '<div class="flex items-center space-x-1.5">' +
        '<div class="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-[10px] text-purple-600 font-bold">' + item.seller.charAt(0) + '</div>' +
        '<span class="text-xs text-gray-500">' + item.seller + '</span>' +
        '</div>' +
        '<div class="flex items-center space-x-3 text-xs text-gray-400">' +
        '<span>' + item.wants + ' wants</span>' +
        '<span>' + item.time + 'h ago</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    card.addEventListener('click', function () {
        sessionStorage.setItem('viewProduct', JSON.stringify(item));
        window.location.href = 'product.html?id=' + item.id;
    });
    grid.appendChild(card);
}

// ========== Category → Subcategory Keyword Map ==========
var categoryMap = {
    'Phones/Digital/Computers': ['iPhone', 'Samsung Phone', 'Huawei Phone', 'Xiaomi Phone', 'OnePlus', 'Honor Phone', 'OPPO Phone', 'vivo Phone', 'iQOO', 'realme', 'Redmi Phone', 'Meizu', 'ZTE', 'Nubia', 'Laptop', 'Tablet', 'Gaming Laptop', 'Desktop PC', 'Bluetooth Earbuds', 'Wired Earphones', 'Speaker', 'Power Bank', 'Projector', 'Portable SSD', 'USB Drive', 'Smartwatch', 'Fitness Band', 'Mirrorless Camera', 'DSLR Camera', 'Mechanical Keyboard', 'Mouse', 'Monitor', 'Graphics Card'],
    'Clothing/Bags/Sports': ['Dress', 'T-Shirt', 'Hoodie', 'Jacket', 'Jeans', 'Sneakers', 'Canvas Shoes', 'Backpack', 'Luggage', 'Watch', 'Running Shoes', 'Basketball Shoes'],
    'Gaming/Vouchers/Collectibles': ['Switch', 'PS5', 'Steam Deck', 'Switch Games', 'Coffee Voucher', 'Food Delivery Coupon', 'Movie Ticket', 'Streaming Sub', 'Pop Mart', 'LEGO', 'Anime Figure', 'Blind Box', 'Board Game'],
    'Textbooks/Study Materials': ['Calculus', 'Physics', 'Linear Algebra', 'C Programming', 'Data Structures', 'GRE Prep', 'Math Prep', 'Test Prep', 'TOEFL/IELTS', 'IELTS', 'Programming Books'],
    'Furniture/Appliances/Daily': ['Desk', 'Chair', 'Desk Lamp', 'Fan', 'Mini Fridge', 'Storage Box', 'Hangers', 'Electric Kettle'],
    'Beauty/Skincare/Personal Care': ['Lipstick', 'Foundation', 'Face Mask', 'Sunscreen', 'Electric Toothbrush', 'Perfume'],
    'Instruments/Stationery/Crafts': ['Acoustic Guitar', 'Ukulele', 'Keyboard Piano', 'Fountain Pen', 'Markers', 'Colored Pencils'],
    'Transport/Rental/Other': ['Bicycle', 'E-Bike', 'Skateboard', 'Cat Food', 'Cat Litter', 'Plants', 'Camera Rental', 'Costume Rental']
};
