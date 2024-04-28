CREATE TABLE book (
	book_id SERIAL PRIMARY KEY,
	ISBN_10 CHAR(10),
	ISBN_13	CHAR(13),
	title	VARCHAR(300) NOT NULL,
	classification	VARCHAR(100),
	reading_date	DATE,
	rating	DECIMAL(3,1) CHECK (rating >=0 AND rating <= 10),
	summary TEXT,
	nearby_check	VARCHAR(2048)
);

CREATE TABLE writer (
	writer_id SERIAL PRIMARY KEY,
	name	VARCHAR(200) NOT NULL,
	date_of_birth	DATE,
	nationality VARCHAR(200)
);

CREATE TABLE book_writing (
	writer_id INTEGER REFERENCES writer(writer_id),
	book_id	INTEGER REFERENCES book(book_id),
	publication_year INTEGER,
	PRIMARY KEY (writer_id, book_id)
);
