const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var async = require('async');

var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_list', {title: 'Book Instances List', bookinstance_list: list_bookinstances});
    })
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Book:', bookinstance:  bookinstance});
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res) {
    BookInstance.findById(req.params.id).populate('book')
    .exec(function(err, instance) {
        if (err) { return next(err); }

        if (instance == null) {
            res.redirect('/catalog/bookinstances')
        }

        res.render('bookinstance_delete', {title: 'Delete Book Instance', bookinstance: instance})
    })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findById(req.body.bookinstanceid)
    .populate('book')
    .exec(function(err, instance) {
        if (err) {return next(err);}

        // Succes delete and list all the instances
        BookInstance.findByIdAndDelete(req.body.bookinstanceid, function deleteBookInstance(err){
            if(err) { return next(err); }

            //Succes redirect to all instances
            res.redirect('/catalog/bookinstances');
        })
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
      book_list: function(callback) {Book.find({}, 'title').exec(callback)},
      book_instance: function(callback) {BookInstance.findById(req.params.id).exec(callback) }  
    }, function(err, results){
        if (err) {return next(err); }
        if (results.book_instance == null) {
            var err = new Error('Book instance not found');
            err.status(404);
            return next(err);
        }
        res.render('bookinstance_form', {title: 'Update Book Instance', book_list: results.book_list, bookinstance: results.book_instance });
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
        // Validate fields.
        body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
        body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
        body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
        
        // Sanitize fields.
        sanitizeBody('book').escape(),
        sanitizeBody('imprint').escape(),
        sanitizeBody('status').trim().escape(),
        sanitizeBody('due_back').toDate(),
        (req, res, next) => {
            const errors = validationResult(req);

            var bookInstance = new BookInstance(
                {
                    book: req.body.book,
                    imprint: req.body.imprint,
                    status: req.body.status,
                    due_back: req.body.due_back,
                    _id: req.params.id
                });
            if (!errors.isEmpty()) {
                async.parallel({
                    book_list: Book.find({}, 'title').exec(callback),
                    book_instance: BookInstance.findById(req.params.id).exec(callback)
                }, function(err, results) {
                    if (err) {return next(err); }
                    res.render('bookinstance_form',{title: 'Update Book Instance', book_list: results.book_list, bookinstance: results.book_instance, errors: errors.array() });
                });
                return;
            }
            else {
                BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}, function(err) {
                    if(err) {return next(err); }
                    // succesfull - redirect to book instance detail page
                    res.redirect(bookInstance.url)
                })
            }
        }
];