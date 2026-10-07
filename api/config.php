<?php
/* ============================================================
   CONFIG.PHP — TỰ ĐỘNG NHẬN RAILWAY / LOCALHOST
   ============================================================ */

/* ============ TỰ ĐỘNG ĐỌC ENV RAILWAY ============ */
function env($key, $default = '') {
    $val = getenv($key);
    if ($val === false || $val === '') {
        if (isset($_ENV[$key])) $val = $_ENV[$key];
        elseif (isset($_SERVER[$key])) $val = $_SERVER[$key];
        else $val = $default;
    }
    return $val;
}

/* Railway MySQL tự inject các biến này */
$DB_HOST = env('MYSQLHOST', env('MYSQL_HOST', 'localhost'));
$DB_PORT = env('MYSQLPORT', env('MYSQL_PORT', '3306'));
$DB_NAME = env('MYSQLDATABASE', env('MYSQL_DATABASE', 'keckyxd_bonsicola'));
$DB_USER = env('MYSQLUSER', env('MYSQL_USER', 'keckyxd_admin'));
$DB_PASS = env('MYSQLPASSWORD', env('MYSQL_PASSWORD', 'Admin@123456'));

/* Nếu có MYSQL_URL đầy đủ (Railway mới) → parse */
$mysql_url = env('MYSQL_URL', env('DATABASE_URL', ''));
if (!empty($mysql_url)) {
    $parsed = parse_url($mysql_url);
    if ($parsed) {
        if (!empty($parsed['host'])) $DB_HOST = $parsed['host'];
        if (!empty($parsed['port'])) $DB_PORT = $parsed['port'];
        if (!empty($parsed['user'])) $DB_USER = $parsed['user'];
        if (!empty($parsed['pass'])) $DB_PASS = $parsed['pass'];
        if (!empty($parsed['path'])) $DB_NAME = ltrim($parsed['path'], '/');
    }
}

define('DB_HOST', $DB_HOST);
define('DB_PORT', $DB_PORT);
define('DB_NAME', $DB_NAME);
define('DB_USER', $DB_USER);
define('DB_PASS', $DB_PASS);

/* ============ ADMIN WEB ============ */
define('ADMIN_EMAIL', 'leminhdz@gmail.com');
define('ADMIN_PASS', 'admin123');

/* ============ HỆ THỐNG ============ */
date_default_timezone_set('Asia/Ho_Chi_Minh');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

/* ============ HÀM DB ============ */
function db() {
    static $pdo = null;
    if ($pdo) return $pdo;
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 10
        ]);
        return $pdo;
    } catch (PDOException $e) {
        out([
            'error' => 'DB: ' . $e->getMessage(),
            'code' => $e->getCode(),
            'config' => [
                'host' => DB_HOST,
                'port' => DB_PORT,
                'name' => DB_NAME,
                'user' => DB_USER
            ]
        ], 500);
    }
}

function out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/* ============ TEST KHI MỞ TRỰC TIẾP ============ */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
        );
        $hasUsers = $pdo->query("SHOW TABLES LIKE 'users'")->rowCount() > 0;

        echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test DB</title>';
        echo '<style>body{font-family:-apple-system,sans-serif;background:#f1f5f9;padding:20px}.box{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08)}.ok{background:#ecfdf5;border-left:5px solid #10b981;padding:16px;border-radius:8px;margin:12px 0}h1{font-size:20px}.warn{background:#fef3c7;border-left:5px solid #f59e0b;padding:16px;border-radius:8px;margin:12px 0}.err{background:#fef2f2;border-left:5px solid #ef4444;padding:16px;border-radius:8px;margin:12px 0}code{background:#f1f5f9;padding:3px 8px;border-radius:5px;font-family:monospace;font-size:12px}.btn{display:inline-block;padding:10px 20px;background:#3b5bfd;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;margin-top:12px}</style></head><body><div class="box">';

        if ($hasUsers) {
            echo '<h1>✅ KẾT NỐI DATABASE THÀNH CÔNG!</h1>';
            echo '<div class="ok"><b>Database OK!</b><br>Bảng users đã tồn tại. Sẵn sàng chạy.</div>';
            echo '<div style="text-align:center"><a href="/" class="btn">🏠 VỀ TRANG CHỦ</a></div>';
        } else {
            echo '<h1>⚠️ CẦN IMPORT SQL</h1>';
            echo '<div class="warn"><b>DB kết nối OK nhưng chưa có bảng!</b><br><br>';
            echo 'Vào <b>Railway → MySQL Database → Data → Query</b> → dán nội dung <code>api/install.sql</code> → Run</div>';
        }

        echo '<div style="background:#eff6ff;padding:12px;border-radius:8px;margin:12px 0;font-size:12px;font-family:monospace">';
        echo 'DB_HOST: <b>' . htmlspecialchars(DB_HOST) . '</b><br>';
        echo 'DB_PORT: <b>' . htmlspecialchars(DB_PORT) . '</b><br>';
        echo 'DB_NAME: <b>' . htmlspecialchars(DB_NAME) . '</b><br>';
        echo 'DB_USER: <b>' . htmlspecialchars(DB_USER) . '</b>';
        echo '</div>';

        echo '</div></body></html>';
        exit;
    } catch (PDOException $e) {
        echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lỗi DB</title>';
        echo '<style>body{font-family:sans-serif;background:#f1f5f9;padding:20px}.box{max-width:640px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08)}.err{background:#fef2f2;border-left:5px solid #ef4444;padding:16px;border-radius:8px;margin:12px 0}h1{color:#dc2626;font-size:20px}code{background:#f1f5f9;padding:3px 8px;border-radius:5px;font-family:monospace;font-size:12px}</style></head><body><div class="box">';
        echo '<h1>❌ LỖI KẾT NỐI DB</h1>';
        echo '<div class="err">' . htmlspecialchars($e->getMessage()) . '</div>';
        echo '<p><b>Code:</b> ' . $e->getCode() . '</p>';
        echo '<p><b>Config:</b></p><ul>';
        echo '<li>Host: <code>' . DB_HOST . '</code></li>';
        echo '<li>Port: <code>' . DB_PORT . '</code></li>';
        echo '<li>DB: <code>' . DB_NAME . '</code></li>';
        echo '<li>User: <code>' . DB_USER . '</code></li>';
        echo '</ul>';
        echo '<p><b>Cách fix:</b> Kiểm tra biến môi trường MySQL trên Railway.</p>';
        echo '</div></body></html>';
        exit;
    }
}
?>
