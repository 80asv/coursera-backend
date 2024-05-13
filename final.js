const express = require('express');
const xml2js = require('xml2js');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());

function saveXmlData(data, filename, callback) {
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(data);
    fs.writeFile(filename, xml, 'utf-8', callback);
}

app.get('/books', async (req, res) => {
    try {
        const data = await fs.promises.readFile('books.xml', 'utf-8');
        const result = await xml2js.parseStringPromise(data);
        const books = result.books.book;
        res.json(books);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error getting the list of books' });
    }
});

app.get('/books/:isbn', (req, res) => {
    const isbn = req.params.isbn;

    fs.promises.readFile('books.xml', 'utf-8')
        .then(data => xml2js.parseStringPromise(data))
        .then(result => {
            const book = result.books.book.find(book => book.isbn[0] === isbn);
            if (!book) {
                res.status(404).json({ error: 'Book not found' });
            } else {
                res.json(book);
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Error searching by ISBN' });
        });
});


app.get('/books/author/:author', async (req, res) => {
    const author = req.params.author;
    try {
        const data = await fs.promises.readFile('books.xml', 'utf-8');
        const result = await xml2js.parseStringPromise(data);
        const booksByAuthor = result.books.book.filter(book => book.author[0] === author);
        res.json(booksByAuthor);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error searching by author' });
    }
});


app.get('/books/title/:title', async (req, res) => {
    const title = req.params.title;
    try {
        const data = await fs.promises.readFile('books.xml', 'utf-8');
        const result = await xml2js.parseStringPromise(data);
        const booksByTitle = result.books.book.filter(book => book.title[0] === title);
        res.json(booksByTitle);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error searching by title' });
    }
});


app.get('/books/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;

    fs.readFile('books.xml', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error reading the book file' });
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error parsing the book file' });
            }

            const book = result.books.book.find(book => book.isbn[0] === isbn);

            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }

            if (!book.review || book.review.length === 0) {
                return res.status(404).json({ error: 'No review available for this book' });
            }

            res.json({ review: book.review[0] });
        });
    });
});


app.post('/users/register', (req, res) => {
    const newUserXml = req.body;

    fs.readFile('users.xml', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error reading the user file' });
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error parsing the user file' });
            }

            result.users.user.push(newUserXml);

            const builder = new xml2js.Builder();
            const updatedXml = builder.buildObject(result);

            fs.writeFile('users.xml', updatedXml, 'utf-8', (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error saving the data' });
                }
                res.json({ message: 'User registered successfully' });
            });
        });
    });
});

app.post('/users/login', (req, res) => {
    const { username, password } = req.body;

    fs.readFile('users.xml', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error reading the user file' });
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error parsing the user file' });
            }

            // Verificar si el objeto result está definido correctamente
            if (!result || !result.users || !result.users.user || result.users.user.length === 0) {
                return res.status(401).json({ error: 'No valid users found in the XML file' });
            }

            // Buscar el usuario en el arreglo de usuarios
            const user = result.users.user.find(user => user.username[1] === username && user.password[1] === password);

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            res.json({ message: 'Successful login' });
        });
    });
});

app.post('/users/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    const { review } = req.body;

    console.log({ req: req.body });

    fs.readFile('books.xml', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error reading the book file' });
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error parsing the book file' });
            }

            const book = result.books.book.find(book => book.isbn[0] === isbn);

            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }

            book.review = [review];

            saveXmlData(result, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error saving the data' });
                }
                res.json({ message: 'Review added/modified successfully' });
            });
        });
    });
});

app.delete('/users/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;

    fs.readFile('books.xml', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error reading the book file' });
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error parsing the book file' });
            }

            const book = result.books.book.find(book => book.isbn[0] === isbn);

            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }

            if (!book.review || book.review.length === 0) {
                return res.status(404).json({ error: 'No review available for this book' });
            }

            delete book.review;

            saveXmlData(result, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error saving the data' });
                }
                res.json({ message: 'Review deleted successfully' });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});