<?php
require_once 'db_config.php';
start_session_if_not_started();
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
$action = $_GET['action'] ?? '';
switch ($action) {
    case 'register':
        handleRegister($pdo);
        break;
    case 'login':
        handleLogin($pdo);
        break;
    case 'logout':
        handleLogout();
        break;
    case 'check_session':
        handleCheckSession();
        break;
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action.']);
        break;
}
function handleRegister($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and password needed.']);
        return;
    }
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password too short.']);
        return;
    }
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    try {
        $stmt = $pdo->prepare("INSERT INTO users (email, password_hash) VALUES (:email, :password_hash)");
        $stmt->execute(['email' => $email, 'password_hash' => $password_hash]);
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Signed up! Now login.']);
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email already used.']);
        } else {
            error_log("Register error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Registration failed.']);
        }
    }
}
function handleLogin($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and password needed.']);
        return;
    }
    try {
        $stmt = $pdo->prepare("SELECT id, email, password_hash FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();
        if ($user && password_verify($password, $user['password_hash'])) {
            start_session_if_not_started();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Logged in!', 'user_id' => $user['id'], 'user_email' => $user['email']]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Wrong email or password.']);
        }
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Login failed.']);
    }
}
function handleLogout() {
    start_session_if_not_started();
    session_unset();
    session_destroy();
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Logged out.']);
}
function handleCheckSession() {
    start_session_if_not_started();
    if (isset($_SESSION['user_id']) && isset($_SESSION['user_email'])) {
        http_response_code(200);
        echo json_encode(['success' => true, 'user_id' => $_SESSION['user_id'], 'user_email' => $_SESSION['user_email']]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Not logged in.']);
    }
}
?>
