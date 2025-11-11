<?php
$dbhost = "localhost";
$dbuser = "root";
$dbpass = "";
$dbname = "lab7";

$message = '';

$conn = mysqli_connect($dbhost, $dbuser, $dbpass, $dbname);
if (!$conn) {
    die("Failed to connect to database");
}

if (isset($_GET['reset'])) {
    $conn->query("DROP TABLE IF EXISTS Lectures");
    $conn->query("DROP TABLE IF EXISTS Labs");
    $message = "Tables deleted.";
}

if (isset($_GET['create'])) {

    $alreadyExists = $conn->query("SHOW TABLES LIKE 'Lectures'");

    if ($alreadyExists && $alreadyExists->num_rows > 0) {
        $message = "Table already exists. Delete before trying again.";
    } else {
        $sql = "SELECT course_json FROM courses WHERE title LIKE 'WEB SYSTEMS DEVELOPMENT'";
        $result = $conn->query($sql);

        if ($result && $row = $result->fetch_assoc()) {
            $string = $row['course_json'];
            $data = json_decode($string, true);

            $conn->query("CREATE TABLE IF NOT EXISTS Lectures (id INT AUTO_INCREMENT PRIMARY KEY, title varchar(255) NOT NULL, description TEXT NOT NULL)");
            $conn->query("CREATE TABLE IF NOT EXISTS Labs (id INT AUTO_INCREMENT PRIMARY KEY, title varchar(255) NOT NULL, description TEXT NOT NULL)");

            if (isset($data['Websys_course']['Lectures'])) {
                foreach ($data['Websys_course']['Lectures'] as $lecture) {
                    $title = $conn->real_escape_string($lecture['Title']);
                    $desc = $conn->real_escape_string($lecture['Description']);
                    $conn->query("INSERT INTO Lectures (title, description) VALUES ('$title', '$desc')");
                }
            }

            if (isset($data['Websys_course']['Labs'])) {
                foreach ($data['Websys_course']['Labs'] as $lab) {
                    $title = $conn->real_escape_string($lab['Title']);
                    $desc = $conn->real_escape_string($lab['Description']);
                    $conn->query("INSERT INTO Labs (title, description) VALUES ('$title', '$desc')");
                }
            }

            $message = "Tables created successfully.";
        } else {
            $message = "Course JSON not found in the database.";
        }
    }
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lab 7 Part 5</title>
    <link rel="stylesheet" href="styles.css" />
</head>
<body>
    <header>
        <h1>ITWS-2110 Web Systems</h1>
    </header>

    <main>
        <section id="content">
            <h2>Part 5</h2>
            <p>Use the buttons below to create or delete the Lectures and Labs tables.</p>

            <form method="get">
                <button type="submit" name="create" value="1">Create Tables</button>
                <button type="submit" name="reset" value="1">Delete Tables</button>
            </form>

            <?php if (!empty($message)): ?>
                <p class="message"><?php echo htmlspecialchars($message); ?></p>
            <?php endif; ?>
        </section>
    </main>
</body>
</html>