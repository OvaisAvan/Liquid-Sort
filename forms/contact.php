<?php
// Security: Prevent direct script access
if ($_SERVER["REQUEST_METHOD"] != "POST") {
  http_response_code(403);
  echo "Access denied.";
  exit;
}

// Rate limiting: Max 5 submissions per IP per hour
session_start();
$ip = $_SERVER['REMOTE_ADDR'];
$rate_limit_key = 'contact_submissions_' . $ip;
$rate_limit_file = sys_get_temp_dir() . '/portfolio_' . md5($ip) . '.json';

$rate_data = [];
if (file_exists($rate_limit_file)) {
  $rate_data = json_decode(file_get_contents($rate_limit_file), true) ?? [];
}

$current_time = time();
$one_hour_ago = $current_time - 3600;

// Remove old submissions
$rate_data['submissions'] = array_filter(
  $rate_data['submissions'] ?? [],
  fn($time) => $time > $one_hour_ago
);

// Check rate limit (max 5 per hour)
if (count($rate_data['submissions'] ?? []) >= 5) {
  http_response_code(429);
  echo "Too many requests. Please try again later.";
  exit;
}

// Input validation & sanitization
$name = isset($_POST["name"]) ? trim($_POST["name"]) : '';
$email = isset($_POST["email"]) ? trim($_POST["email"]) : '';
$subject = isset($_POST["subject"]) ? trim($_POST["subject"]) : '';
$message = isset($_POST["message"]) ? trim($_POST["message"]) : '';

// Validate inputs
$errors = [];

if (empty($name) || strlen($name) < 2 || strlen($name) > 100) {
  $errors[] = "Name must be between 2 and 100 characters.";
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  $errors[] = "Please provide a valid email address.";
}

if (empty($subject) || strlen($subject) < 3 || strlen($subject) > 200) {
  $errors[] = "Subject must be between 3 and 200 characters.";
}

if (empty($message) || strlen($message) < 10 || strlen($message) > 5000) {
  $errors[] = "Message must be between 10 and 5000 characters.";
}

// Honeypot: check for hidden field (spam bot detection)
if (!empty($_POST["website"] ?? '')) {
  http_response_code(400);
  echo "Invalid submission.";
  exit;
}

if (!empty($errors)) {
  http_response_code(400);
  echo json_encode(['errors' => $errors]);
  exit;
}

// Sanitize inputs to prevent injection attacks
$name = htmlspecialchars(strip_tags($name), ENT_QUOTES, 'UTF-8');
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
$subject = htmlspecialchars(strip_tags($subject), ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars(strip_tags($message), ENT_QUOTES, 'UTF-8');

// Remove newlines from email headers to prevent header injection
$safe_name = str_replace(["\r", "\n", "%0a", "%0d"], '', $name);
$safe_email = str_replace(["\r", "\n", "%0a", "%0d"], '', $email);
$safe_subject = str_replace(["\r", "\n", "%0a", "%0d"], '', $subject);

// Prepare email
$recipient = "ovaisavan1996@gmail.com";
$email_subject = "[Portfolio Contact] " . $safe_subject;
$email_content = "Name: " . $safe_name . "\n";
$email_content .= "Email: " . $safe_email . "\n";
$email_content .= "Submitted: " . date('Y-m-d H:i:s') . "\n";
$email_content .= "IP Address: " . $ip . "\n";
$email_content .= "---\n\n";
$email_content .= "Message:\n" . $message . "\n";

// Email headers with proper security
$email_headers = "From: " . $safe_email . "\r\n";
$email_headers .= "Reply-To: " . $safe_email . "\r\n";
$email_headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$email_headers .= "X-Mailer: Portfolio Contact Form\r\n";

// Send email with error handling
if (mail($recipient, $email_subject, $email_content, $email_headers)) {
  // Log successful submission for rate limiting
  $rate_data['submissions'][] = $current_time;
  file_put_contents($rate_limit_file, json_encode($rate_data));

  http_response_code(200);
  echo json_encode(['success' => true, 'message' => 'Message sent successfully. I\'ll get back to you soon!']);
} else {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Failed to send message. Please try again later.']);
}
?>
