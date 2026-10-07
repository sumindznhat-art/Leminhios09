<?php
/* ============================================================
   BONSICOLA TOOL — CONFIG DATABASE
   ============================================================ */

define('DB_HOST', 'localhost');
define('DB_NAME', 'keckyxd_bonsicola');
define('DB_USER', 'keckyxd_admin');
define('DB_PASS', 'Minh@Tool2026#Xyz');

define('ADMIN_EMAIL', 'leminhdz@gmail.com');
define('ADMIN_PASS', 'admin123');

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

/* Test kết nối DB khi truy cập trực tiếp */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
        );
        $has = $pdo->query("SHOW TABLES LIKE 'users'")->rowCount() > 0;
        echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test DB</title><style>body{font-family:sans-serif;background:#f1f5f9;padding:20px}.box{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08)}.ok{background:#ecfdf5;border-left:5px solid #10b981;padding:16px;border-radius:8px;margin:12px 0}h1{font-size:20px}.warn{background:#fef3c7;border-left:5px solid #f59e0b;padding:16px;border-radius:8px;margin:12px 0}code{background:#f1f5f9;padding:3px 8px;border-radius:5px;font-family:monospace}.btn{display:inline-block;padding:10px 20px;background:#3b5bfd;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;margin-top:12px}</style></head><body><div class="box">';
        if ($has) {
            echo '<h1>✅ KẾT NỐI DATABASE THÀNH CÔNG!</h1><div class="ok"><b>Database OK — Bảng users đã tồn tại.</b></div><div style="text-align:center"><a href="/" class="btn">🏠 VỀ TRANG CHỦ</a></div>';
        } else {
            echo '<h1>⚠️ CẦN IMPORT SQL</h1><div class="warn">Vào <b>phpMyAdmin</b> → chọn DB <code>' . DB_NAME . '</code> → tab SQL → dán <code>install.sql</code> → Go</div>';
        }
        echo '</div></body></html>';
        exit;
    } catch (PDOException $e) {
        echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lỗi DB</title><style>body{font-family:sans-serif;background:#f1f5f9;padding:20px}.box{max-width:640px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08)}.err{background:#fef2f2;border-left:5px solid #ef4444;padding:16px;border-radius:8px;margin:12px 0}h1{color:#dc2626;font-size:20px}code{background:#f1f5f9;padding:3px 8px;border-radius:5px;font-family:monospace;font-size:12px}</style></head><body><div class="box"><h1>❌ LỖI DATABASE</h1><div class="err">' . htmlspecialchars($e->getMessage()) . '</div><p><b>Code lỗi:</b> ' . $e->getCode() . '</p><p><b>Config hiện tại:</b></p><ul><li>DB_NAME: <code>' . DB_NAME . '</code></li><li>DB_USER: <code>' . DB_USER . '</code></li><li>DB_PASS: <code>' . substr(DB_PASS,0,3) . '***' . substr(DB_PASS,-3) . '</code></li></ul></div></body></html>';
        exit;
    }
}

function db() {
    static $pdo = null;
    if ($pdo) return $pdo;
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
        return $pdo;
    } catch (PDOException $e) {
        out(['error' => 'DB: ' . $e->getMessage(), 'code' => $e->getCode()], 500);
    }
}

function out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
?>
