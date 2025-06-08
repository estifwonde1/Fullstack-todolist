<?php
require_once 'db_config.php';
start_session_if_not_started();
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in to manage todos.']);
    exit();
}
$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);
switch ($method) {
    case 'GET':
        handleGetTodos($pdo, $user_id);
        break;
    case 'POST':
        handleAddTodo($pdo, $user_id, $data);
        break;
    case 'PUT':
        handleUpdateTodo($pdo, $user_id, $data);
        break;
    case 'DELETE':
        handleDeleteTodo($pdo, $user_id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
        break;
}
function handleGetTodos($pdo, $user_id) {
    try {
        $stmt = $pdo->prepare("SELECT id, text, completed FROM todos WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->execute(['user_id' => $user_id]);
        $todos = $stmt->fetchAll();
        http_response_code(200);
        echo json_encode(['success' => true, 'todos' => $todos]);
    } catch (PDOException $e) {
        error_log("Get todos error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to get todos.']);
    }
}
function handleAddTodo($pdo, $user_id, $data) {
    $text = $data['text'] ?? '';
    if (empty($text)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Task text cannot be empty.']);
        return;
    }
    try {
        $stmt = $pdo->prepare("INSERT INTO todos (user_id, text) VALUES (:user_id, :text)");
        $stmt->execute(['user_id' => $user_id, 'text' => $text]);
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Task added.']);
    } catch (PDOException $e) {
        error_log("Add todo error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to add task.']);
    }
}
function handleUpdateTodo($pdo, $user_id, $data) {
    $id = $data['id'] ?? null;
    $completed = $data['completed'] ?? null;
    if (empty($id) || !isset($completed)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Task ID and status needed for update.']);
        return;
    }
    try {
        $stmt = $pdo->prepare("UPDATE todos SET completed = :completed WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['completed' => $completed, 'id' => $id, 'user_id' => $user_id]);
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Task updated.']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Task not found or you don\'t own it.']);
        }
    } catch (PDOException $e) {
        error_log("Update todo error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update task.']);
    }
}
function handleDeleteTodo($pdo, $user_id) {
    $id = $_GET['id'] ?? null;
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Task ID needed for delete.']);
        return;
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM todos WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $id, 'user_id' => $user_id]);
        if ($stmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Task deleted.']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Task not found or you don\'t own it.']);
        }
    } catch (PDOException $e) {
        error_log("Delete todo error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete task.']);
    }
}
?>
