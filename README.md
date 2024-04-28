# capstoneproject5_booknotes
Capstone Project 5 - Booknotes (EJS + Express.js + PostgreSQL)
A web application to list the books favored.

# initializaition
- "npm init" to start the npm;
- "npm i" to install all packages required
- "node index.js" to start the server

# web application functions
- Query: query all the books' information in the database
- Ordering: can choose the display of books according to "reading-date", "publishing-year", or "recommendation rate"
- Edit: only book summary is editable currently
- Delete: every book can be deleted both from the client-side and from the database.
- No "Create" is included considering the relationship between the tables is "Many-to-many".

# client-side
HTML + CSS + jQuery + EJS

# server-side
Express.js

# database
- PostgreSQL
- A query file is included.
- An excel file is included as the dummy data

# others
Most book-cover images are returned from the Open Library Covers API (https://openlibrary.org/dev/docs/api/covers) if available.
