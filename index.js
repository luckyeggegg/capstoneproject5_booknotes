import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "book",
    password: "useyourlefthand",
    port: 5432,
  });
  db.connect();

const app = express();
const port = process.env.PORT || 3000; 


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(express.static("public"));

let bookList = [];

// let orderItem = "book.reading_date";

async function queryBooks(orderItem) {

    // Valid the effective order item input to prevent SQL injection vulnerabilities
    const validOrderItems = ["reading_date", "rating", "publication_year"]; // Add all valid order items here
    const orderBy = validOrderItems.includes(orderItem) ? orderItem : "reading_date";   // Only allow valid order items
    // console.log(orderBy);

    try {
        const result = await db.query(`SELECT book.book_id, book.isbn_13, book.title, book.classification, book.reading_date, TO_CHAR(book.reading_date, 'YYYY/MM/DD') as formatted_reading_date, book.rating, book.summary, book.nearby_check, writer.writer_id, writer.name, book_writing.publication_year FROM book INNER JOIN book_writing ON book.book_id = book_writing.book_id INNER JOIN writer ON book_writing.writer_id = writer.writer_id ORDER BY ${orderBy} DESC`);
        return result.rows;
    } catch(err) {
        console.error("Error executing query", err.stack);
        throw err;
    }
};
// parameterized queries in PostgreSQL are designed to prevent SQL injection and are therefore treated as constants, not as identifiers or SQL expressions. This means you cannot use them to dynamically insert column names, table names, or other SQL syntax. They are meant for values like strings, numbers, etc.To fix this, you should directly concatenate the column name into the SQL string. Note that this is safe in this particular case because orderItem is a hard-coded string and not user input. If it were user input, you would need to validate it to ensure it's a valid column name to prevent SQL injection.

async function bookCover(isbn13) {
    const size = "M";
    const url = `https://covers.openlibrary.org/b/isbn/${isbn13}-${size}.jpg?default=false`;
    const defaultImgPath = path.join(__dirname, "public/assets/bookcover_default.png");

    try{
        const response = await axios.get(url, {responseType: "arraybuffer"}); // fetch the image from the API
        // {responseType: 'arraybuffer'}: This part of the code is the configuration object mentioned above. The responseType property tells axios how to handle the response data. Setting responseType to 'arraybuffer' means you're instructing axios to treat the response data as an ArrayBuffer.ArrayBuffer: An ArrayBuffer is a generic, fixed-length container for binary data. They are used to represent a generic, fixed-length raw binary data buffer. You can think of it as a low-level representation of a binary file, which is very useful when dealing with binary data such as images, videos, etc., over the network.Why use 'arraybuffer' for images?When fetching an image or any other binary file, you need to handle it as binary data rather than text. By setting responseType to 'arraybuffer', you ensure that axios provides the response data as an ArrayBuffer. This is crucial because you're dealing with binary data (a JPEG image, in this case) that you then convert to a base64 encoded string to embed directly in your HTML using a Data URL.

        const coverData =  Buffer.from(response.data, 'binary').toString('base64'); // convert the image data to base64
        // this line converts the ArrayBuffer (binary data received as the response) into a base64 encoded string. This string can then be used directly in an <img> tag's src attribute to display the image on the web page without needing a separate URL or file.

        return `data:image/jpeg; base64, ${coverData}`;
        // When you convert an image to a Base64 string, the resulting string isn't useful on its own. To display it as an image in a web page, you need to signal to the browser what type of data the string represents. This is done via a Data URI scheme.

    } catch(err) {
        // console.error(err);
        
        // fetch the default book cover image if API request is failed
        try{
            const coverData = fs.readFileSync(defaultImgPath, {encoding: 'base64'});
            // The fs.readFileSync() function is used here because we want to read the file data before proceeding to the next step of the code.

            return `data:image/png; base64, ${coverData}`;
        } catch(err) {
            console.error("Error in reading default image file", err);
        }
    };
};

async function summaryUpdate(newSummary, bookId) {
    try {
        const updateSQL = "UPDATE book SET summary = $1 WHERE book_id = $2";
        const updateSummary = await db.query(updateSQL, [newSummary, bookId]);
    } catch (err) {
        console.error("Error in updating the book summary", err);
    }
};

async function deleteBook(bookId) {
    try {
        const deleteSQL = "DELETE FROM book_writing WHERE book_id = $1"
        const deleteBook = await db.query(deleteSQL, [bookId]);
    } catch(err) {
        console.error("Error in deleting the book", err);
    }
}


app.get("/", async (req, res) => {
    // Use the query parameter or default to reading_date
    const orderItem = req.query.orderItem || "book.reading_date";
    console.log(orderItem);
        
    try {
        bookList = await queryBooks(orderItem);
        
        // Map over bookList to append bookCover data.
        // The Array.map() function is a very useful and often used method in JavaScript that creates a new array by applying a function on every element of an existing array.The reason why we are using map() instead of forEach() in this use case is because map() returns a new array which is exactly what we want. We want to create a new array with the same set of books but with an additional property, coverImg.
        // Promise.all() is a built-in JavaScript method that accepts an iterable (like an array or a string) of promises and returns a single promise that fulfills when all of the promises in the iterable argument have fulfilled.If any promise in the array rejects, the promise returned by Promise.all() immediately rejects with that reason, discarding all results from other promises.
        const bookWithCover = await Promise.all(bookList.map(async (book) => {
            try {
                const coverImg = await bookCover(book.isbn_13);
                return {...book, coverImg}; // Spread the book object and add a new property 'coverImg'
            } catch(err) {
                console.error('Error in fetching the book cover', err);
                return book; // If an error occurs, return the book without the 'coverImg' property
            }
        }));
        
        // console.log(bookList);

        res.render("index.ejs", {
            bookList: bookWithCover // Render with the updated bookList
        });
    } catch(err) {
        console.error("Error in display the book list", err);
        res.status(500).send({message: "Error in display the book list" });
    }

});

app.get("/update/:id", (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const bookToUpdate = bookList.find(book => book.book_id === bookId);
    if (bookToUpdate) {
        res.render("update.ejs", {
            bookToUpdate: bookToUpdate
        });
    } else {
        res.status(404).send("Book is not found.");
    }

});

app.post("/book/summaryUpdated/:id", async (req, res) => {
    const newSummary = req.body.summary;
    const bookId = parseInt(req.params.id);
    console.log(newSummary, bookId);

    try {
        summaryUpdate(newSummary, bookId);
        res.redirect("/");
    } catch(err) {
        res.status(500).send({message: "Error in updating the book summary" });
    }
    
});

app.delete("/delete/:id", async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    try {
        await deleteBook(bookId);

        // res.redirect("/"); The server route for deletion attempts to redirect after performing the deletion. However, in an AJAX request scenario, the redirect will not behave as expected since the request is made in the background. Instead of redirecting, you should send back a success response and let the client-side JavaScript update the UI accordingly. Here's a revised server-side handler:
        
        res.status(200).json({ message: "Book deleted successfully" });
    } catch(err) {
        res.status(500).send({message: "Error in deleting the book" });
    }
}); 




app.listen(port, () => {
    console.log(`Server has started on port ${port}.`);
})