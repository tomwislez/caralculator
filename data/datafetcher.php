<?php
// Set timezone (for logging timestamps)
date_default_timezone_set("Europe/Brussels");

// Get current timestamp
$timestamp = date("Y-m-d H:i:s");

// Basic info
print(" Running Colruyt Data Fetcher...\n");

// Set file paths
$outputFile = __DIR__ . '/cara.html';
$caraPriceJson = __DIR__ . '/caraPrice.json';
$logFile = __DIR__ . '/datafetcher_log.txt';



// Load existing data if file exists
if (file_exists($caraPriceJson)) {
    $data = json_decode(file_get_contents($caraPriceJson), true);
    if (!is_array($data)) {
        $data = []; // fallback if file is malformed
    }
} else {
    $data = [];
}






// Colruyt URL
$colruytURL = "https://www.collectandgo.be/colruyt/nl/assortiment/everyday-cara-pils-4-4vol-blik-33cl-5383?utag_data";

// Initialize cURL
$ch = curl_init($colruytURL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // follow redirects

// Execute the request
$response = curl_exec($ch);

// Check for curl errors
if (curl_errno($ch)) {
    $error = curl_error($ch);
    file_put_contents($logFile, "[" . date("Y-m-d H:i:s") . "]  cURL error: $error\n", FILE_APPEND);
    curl_close($ch);
    exit(1);
}

// Check HTTP response code
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    file_put_contents($logFile, "[" . date("Y-m-d H:i:s") . "]  Failed to download Colruyt data. HTTP code: $httpCode\n", FILE_APPEND);
    exit(1);
}

// Save HTML to local file
file_put_contents($outputFile, $response);

// Success log
file_put_contents($logFile, "[" . date("Y-m-d H:i:s") . "]  Data saved to $outputFile\n", FILE_APPEND);

// Done!
print(" HTML successfully saved to file. More info in logs!\n");


// Extract the price using regex
if (preg_match("/product_unitprice\s*=\s*\['([\d.,]+)'\]/", $response, $matches)) {
    $price = $matches[1];
    print(" Cara Pils price found: €$price\n");
    file_put_contents($logFile, "[" . date("Y-m-d H:i:s") . "]  Cara price found: €$price\n", FILE_APPEND);

    $data[$timestamp] = floatval($price); // cast to float just to be clean

    // Write data to file
    file_put_contents($caraPriceJson, json_encode($data, JSON_PRETTY_PRINT));
    
    // Log success
   
    file_put_contents($logFile, "[" . $timestamp . "]  Cara price added to JSON log\n", FILE_APPEND);

    print(" Added €$price to caraPrice.json\n");
} else {
    print(" Could not find the product price in HTML.\n");
    file_put_contents($logFile, "[" . date("Y-m-d H:i:s") . "]  Failed to extract Cara price from HTML\n", FILE_APPEND);
}






















?>
