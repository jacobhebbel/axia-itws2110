<?php
$dbhost = "localhost";
$dbuser = "root";
$dbpass = "";
$dbname = "lab7";

if(!$conn = mysqli_connect($dbhost,$dbuser,$dbpass,$dbname)) {
    die("failed to connect to database");
}

if (isset($_GET['reset'])) {
    $conn->query("DROP TABLE IF EXISTS Lectures");
    $conn->query("DROP TABLE IF EXISTS Labs");
    echo "<p>Tables deleted.</p>";
}

if (isset($_GET['create'])) {

    $alreadyExists = $conn->query("SHOW TABLES LIKE 'Lectures'");

    if ($alreadyExists && $alreadyExists->num_rows > 0) {
        echo "<p>Table already exists. Delete before trying again.</p>";
    } else {
        $sql = "SELECT course_json from courses where title like '%WEB SYSTEMS DEVELOPMENT%'";
        $result = $conn->query($sql);

        $row = $result->fetch_assoc();
        $string = $row['course_json'];

        $data = json_decode($string, true);

        $conn->query("CREATE TABLE IF NOT EXISTS Lectures (id INT AUTO_INCREMENT PRIMARY KEY, title varchar(255) NOT NULL, description TEXT NOT NULL)");
        $conn->query("CREATE TABLE IF NOT EXISTS Labs (id INT AUTO_INCREMENT PRIMARY KEY, title varchar(255) NOT NULL, description TEXT NOT NULL)");

        if (isset($data['Lectures'])) {
            foreach ($data['Lectures'] as $lecture) {
                $title = $conn->real_escape_string($lecture['Title']);
                $desc = $conn->real_escape_string($lecture['Description']);
                $conn->query("INSERT into Lectures (title, description) VALUES ('$title', '$desc')");
            }
        }

        if (isset($data['Labs'])) {
            foreach ($data['Labs'] as $lab) {
                $title = $conn->real_escape_string($lab['Title']);
                $desc = $conn->real_escape_string($lab['Description']);
                $conn->query("INSERT into Labs (title, description) VALUES ('$title', '$desc')");
            }
        }
    }
}

echo '<form method="get">
        <button type="submit" name="create" value="1">Create Tables</button>
        <button type="submit" name="reset" value="1">Delete Tables</button>
      </form>';

$conn->close();
?>