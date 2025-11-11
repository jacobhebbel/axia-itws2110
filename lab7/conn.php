<?php

$dbhost = "localhost";
$dbuser = "root";
$dbpass = "";
$dbname = "lab7";

$conn = mysqli_connect($dbhost, $dbuser, $dbpass, $dbname);

if (!$conn) {
    die("Failed to connect to database");
}

$sql = "SELECT course_json FROM courses WHERE title LIKE 'WEB SYSTEMS DEVELOPMENT'";
$result = $conn->query($sql);

if ($result && $row = $result->fetch_assoc()) {
    $jsonString = $row['course_json'];
    
    $data = json_decode($jsonString, true);

    if ($data === null) {
        die("Failed to find json");
    } else {
        echo json_encode($data);
    }
} else {
    die("Failed to find course");
}

$conn->close();
?>