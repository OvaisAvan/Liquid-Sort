<?php
// Get the requested ad file
$ad = isset($_GET['ad']) ? basename($_GET['ad']) : '';

// List of valid playable ads
$valid_ads = ['color-block.html', 'zombie-fire.html'];

if (!in_array($ad, $valid_ads)) {
    http_response_code(404);
    echo "Ad not found";
    exit;
}

$file_path = __DIR__ . '/' . $ad;

if (!file_exists($file_path)) {
    http_response_code(404);
    echo "Ad file not found";
    exit;
}

// Set headers
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=3600');
header('Access-Control-Allow-Origin: *');

// Stream the file
readfile($file_path);
?>
