Team Name: Axia
Slogan: Smart Finance, Simple Solutions
Team Members: Samantha Steenbruggen, Jacob Hebbel, Jake Collen, Ryan Thomas, Matthew Lifrieri

Lab 7: The purpose of this lab was to practice PHP and SQL by creating a webpage to recreate a spookier version of an LMS. The project focused on building a functional, dynamic web application that could store, retrieve, and display data from a database while incorporating a visually engaging spooky theme (yay halloween!). Our goal was to combine back-end development with front-end design, focusing on database interactions, server-side scripting, and user interface elements. By completing this lab, the goal was to strengthen our skills in SQL query design, PHP integration with HTML, and the creation of interactive web pages that respond to user input. The team collaborated on database design, query development, page styling, and debugging to successfully implement the lab requirements. Below, you will find the SQL queries ran for our database. 

For individual contributions and blockers, please see individual repository READMEs. 

Image Sources:
- https://wallpapers.com/background/spooky-background-6san6fli9tt43iqv.html

SQL Queries:  

Part 2 Commands

ALTER TABLE students
ADD COLUMN street varchar(255),
add column city varchar(255),
add column state char(2),
add column zip char(5)

alter table courses
add column section VARCHAR(10),
add column year YEAR

CREATE table grades ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    crn INT(11), 
    RIN INT(9), 
    grade INT(3) NOT NULL, 
    FOREIGN KEY (crn) REFERENCES courses(crn), 
    FOREIGN KEY (RIN) REFERENCES students(RIN) 
);

INSERT INTO courses (crn, prefix, number, title, section, year)
VALUES
(75418, 'CSCI', 2800, 'COMPUTER ARCHITECTURE & OS', '02', 2025),
(73291, 'CSCI', 2200, 'FOUNDATIONS OF COMPUTER SCI', '03', 2025),
(72087, 'MATH', 2400, 'INTRO DIFFERENTIAL EQUATIONS', '05', 2025),
(73048, 'ITWS', 2110, 'WEB SYSTEMS DEVELOPMENT', '01', 2025);


INSERT INTO students (RIN, RCSID, first_name, last_name, alias, phone, street, city, state, zip)
VALUES
(662092352, 'thomar9', 'Ryan', 'Thomas', 'Ry', 2051234567, '12 Family Street', 'New City', 'NY', '10956'),
(662089080, 'collej2', 'Jake', 'Collen', 'Jake', 2088059384, '211 Foster Road', 'Cropseyville', 'NY', '12052'),
(662014159, 'hebbej', 'Jacob', 'Hebbel', 'Jacob', 2084968896, '42 Delano Road', 'Marion', 'MA', '02738'),
(662081897, 'lifrim', 'Matthew', 'Lifrieri', 'Matt', 1800123456, '1600 Pennsylvania Ave NW', 'Quahog', 'RI', '20500');


INSERT into grades (crn, RIN, grade)
VALUES
(72087, 662092352, 98),
(73048, 662092352, 97),
(73291, 662092352, 96),
(75418, 662092352, 99),
(72087, 662089080, 68),
(73048, 662081897, 95),
(73291, 662089080, 86),
(75418, 662014159, 90),
(72087, 662089080, 98),
(73048, 662014159, 97)


SELECT * from students
ORDER by RIN, last_name, RCSID, first_name
-- Result -- 
RIN   	RCSID   	first_name   	last_name   	alias	phone	street	city	state	zip	
662014159	hebbej	Jacob	Hebbel	Jacob	2084968896	42 Delano Road	Marion	MA	02738	
662081897	lifrim	Matthew	Lifrieri	Matt	1800123456	1600 Pennsylvania Ave NW	Quahog	RI	20500	
662089080	collej2	Jake	Collen	Jake	2088059384	211 Foster Road	Cropseyville	NY	12052	
662092352	thomar9	Ryan	Thomas	Ry	2051234567	12 Family Street	New City	NY	10956	
------------


SELECT DISTINCT s.RIN, s.first_name, s.last_name, s.street, s.city, s.state, s.zip
FROM students s
JOIN grades g ON s.RIN = g.RIN
WHERE g.grade > 90;
-- Result -- 
RIN   	RCSID   	first_name   	last_name   	alias	phone	street	city	state	zip	
662014159	hebbej	Jacob	Hebbel	Jacob	2084968896	42 Delano Road	Marion	MA	02738	
662081897	lifrim	Matthew	Lifrieri	Matt	1800123456	1600 Pennsylvania Ave NW	Quahog	RI	20500	
662089080	collej2	Jake	Collen	Jake	2088059384	211 Foster Road	Cropseyville	NY	12052	
662092352	thomar9	Ryan	Thomas	Ry	2051234567	12 Family Street	New City	NY	10956	
------------



SELECT c.crn, c.prefix, c.number, c.title, AVG(g.grade) AS average_grade
FROM courses c
JOIN grades g ON c.crn = g.crn
GROUP BY c.crn;
-- Result -- 
RIN   	RCSID   	first_name   	last_name   	alias	phone	street	city	state	zip	
662014159	hebbej	Jacob	Hebbel	Jacob	2084968896	42 Delano Road	Marion	MA	02738	
662081897	lifrim	Matthew	Lifrieri	Matt	1800123456	1600 Pennsylvania Ave NW	Quahog	RI	20500	
662089080	collej2	Jake	Collen	Jake	2088059384	211 Foster Road	Cropseyville	NY	12052	
662092352	thomar9	Ryan	Thomas	Ry	2051234567	12 Family Street	New City	NY	10956	
------------



SELECT c.crn, c.prefix, c.number, c.title, COUNT(g.RIN) AS num_students
FROM courses c
JOIN grades g ON c.crn = g.crn
GROUP BY c.crn;
-- Result -- 
RIN   	RCSID   	first_name   	last_name   	alias	phone	street	city	state	zip	
662014159	hebbej	Jacob	Hebbel	Jacob	2084968896	42 Delano Road	Marion	MA	02738	
662081897	lifrim	Matthew	Lifrieri	Matt	1800123456	1600 Pennsylvania Ave NW	Quahog	RI	20500	
662089080	collej2	Jake	Collen	Jake	2088059384	211 Foster Road	Cropseyville	NY	12052	
662092352	thomar9	Ryan	Thomas	Ry	2051234567	12 Family Street	New City	NY	10956	
------------
