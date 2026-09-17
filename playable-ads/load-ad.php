<?php
// Playable Ads Loader - Bypass HTTP/2 Protocol Errors
// Load HTML ads through PHP to avoid direct HTTP/2 issues

// Disable caching for debugging
header('Cache-Control: no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Set content type
header('Content-Type: text/html; charset=utf-8');

// Get requested ad
$ad = isset($_GET['ad']) ? basename($_GET['ad'], '.html') : '';

// Whitelist valid ads
$valid_ads = array('color-block', 'zombie-fire');

if (empty($ad) || !in_array($ad, $valid_ads)) {
    http_response_code(400);
    exit('Invalid ad request');
}

// Build file path
$file = __DIR__ . '/' . $ad . '.html';

// Verify file exists
if (!is_file($file) || !is_readable($file)) {
    http_response_code(404);
    exit('Ad not found');
}

// Read and output file content
$content = file_get_contents($file);

if ($content === false) {
    http_response_code(500);
    exit('Error reading ad');
}

// Output the content
echo $content;
exit;
?>
