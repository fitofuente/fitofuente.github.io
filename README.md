# **Online PDF Editor**
## Video Demo: [Online PDF Editor](https://youtu.be/YDykWLdI0Ew)

The project description will be separated into four main sections; Website's main goal, Available tools, Frontend and Backend.

## Main goal
The main goal is to provide the user with a free tool to manipulate PDF documents.

## Available operations
- Image-to-PDF conversion.
    - Supported formats: .jpg, .jpeg, .png, .bmp, .gif, .tiff
- PDF merging.
- PDF splitting.

### Common steps to each operation
There are two main ways in which a file (or files) can be opened to operate them. You can click on the corresponding button, in which case, a file picker will show up for you to select the file (or files), or you can drag and drop the files on top of the corresponding buttons.

### Common steps for Image-to-PDF conversion and  PDF merging
Once you have selected the files you want to work on, you will be send to the "standby room or preparation room" where you can *add more files* or you can *move them around* to change the position in the final document.

> Note: 
>
> In this version you can't remove files from this room, if you (somehow) need to have less files than the ones you uploaded, you will need to start again.

Finally, and if you are ready, you can click on the operation button ("Convert or Merge") to operate the file.

### PDF Splitting
Once you have selected the file you want to split, a PDF reader (implementd using a library (described in the Frontend section)) will show you the document. 

If satisfied, at the bottom you can select which pages you wish to extract (from and to) and a button to split (or extract) the pages.

> Note:
>
> In this version you can only use the tools zoom in, zoom out, resize and move.
>
> Because the way the PDF reader was impemented, for large size documents, when you zoom or resize the document, the response between the button is pressed and the action occur might not be inmediatly.

### Download the file
As all roads lead to Rome, here all operations lead to the home page where you can donwload your file.

After downloading the file, this will be saved by default in your downloads folder and by the name "output.pdf" for the Image-to-PDF and the Merge operations and "output.zip" for the Split operation.

## **Frontend**
The frontend is separated into three sections; HTML (using Jinja2), CSS and Javascript.

### **HTML**
As Python is the backend language, *Jinja2* was used to create the HTML templates.

HTML documents:
- layout.html - where the basic structure is built.
- index.html - from where you select the operations and where you return to download the file.
- standby.html - where you prepare the files (adding more or changing the position).
- split.html - where you can visualize the PDF and split it as you like.

#### Files overview:
The **layout.html**, by adding "PDF Editor: `{% block title %}{% endblock %}`" to the title, dinamically adds the title based on the page the user is visiting, for instance, if the user is at the home page, the title will say "PDF Editor: Home" and if the user is at the Split operation the title will say "PDF Editor: Split PDF".

Later in the templates you can use `{% block title %} <page title> {% endblock %}` to set the title of the template.

In addition, *Flask's flash method* was used to display messages if something went wrong when handling the files (images or PDFs), a *main block* (`{% block main %}{% endblock %}`) was also used to insert content dinamically based on the renderer template (backend).

Finally, once in the templates, `{% extends "layout.html" %}` was used to include *layout.html* in the corresponding template which will include (among other things) all the *scripts* and the *CSS* files that where used for this project.

The **index.html** is the user's start and ending point. Worth to comment the Lines 8 to 26 `{% if download != False %}...{% endif %}` where the app check if there is a file to download and if so, display the modal to donwload the file. Inside these lines, there is a `<script>...</script>` element which is used for hidding the modal once the user pressed on the download button.

Between Lines 33 and 62 you will find the `<form>...</form>` element where the `action` of this form will be setted using Javascript. Here, three hidden inputs (one for each operation) will send information to the backend whereas the form's `action` attribute will be set with the `id` attribute of the `button` elements.

The **standby.html** will hold the preparation of the files. This document is the same for both the Image-to-PDF conversion and the PDF merging operations, depending on the the operation the user had selected, the `session['files']` variable from *Flask* (later in backend) will contain images or pdf documents. Then, between Lines 12 and 23 `{% for dict in session['files'] %}...{% endfor %}`, files will be inserted (in a row and column table) one after the other depending on the files the user selected in the home page.

Lines 15 to 19 are just for stylish purpose `{% if operation == "Convert" %}...{% elif operation == "Merge" %}...{% endif %}`, these lines will display the correct icon based on the file (image or pdf).

Lines 24 to 30 `{% with format = session["files"][0]["format"] %}...{% endwith %}` are kinda stylish as well, but these lines where used not just to display the correct format in the file picker (stylish part) but to store new files added to the operation.

Lines 10 and 34 have these variables `{{ redirect }}` and `{{ operation }}` which basically tells the form where to send the information and which text displayed in the button.

The **split.html** document will show the PDF reader and display the document the user wants to split. Worth commenting are Lines from 8 to 10 `{% if session["files"] %}...{% endif %}` where a `sessionStorage` variable is set if there is at least one file in the `session["files"]` variable from *Flask*. The value from the `sessionStorage` is used then in Javascript to `fetch` the PDF document and to render it in the Line 22.

The `<form>...</form>` from Line 27 will get the extracted pages from the `<input>`s and send this information to the backend.

### **CSS**
There is no much to say about the CSS files than that these are separated in three.
- styles.css - where the main styles are.
- drag.css - where the styles for the drag and drop styles are.
- read.css - where the PDF reader styles are.

### **Javascript**
There are three main *.js* files in this project:
- main.js - it contains the main functionality of the website.
- helper.js - where the helper functions that the main.js use are.
- style.js - stylish functions used to control some aspects of the website.

#### Files overview:
The **main.js** file is where all the (frontend) functions that controls the website are. Even though each function has a description of what it does I'll briefly explain how they were implemented.

Upon openning this file we'll find an `import ... from ...` this line of code is importing useful functions (from **helper.js**) that were created to help with certain tasks.

From Line 5 to 36, the functions are ran based on the URL, this is a way to prevent some functions to trigger in wrong pages.

The **`addFiles()`** function will add files by dynamically creating HTML elements for each added file. This function will be call everytime the user click on the "Add" button (the one with the plus icon).

Initially, the DOM elements are capture waiting for the user to click on the "Add" button. Now, this `"click"` event will trigger an `async` function which will use the `async` functions `await wait_fp()` and `await wait_file()` and as the name suggest, the purpose of these functions is to wait for the file picker to show up and wait for a file to be (or not) picked, respectively.

In Line 85, a fragment object `let fgm = document.createDocumentFragment()` is created, this object is used to insert (by the `append()` method) the elements created later on Lines 100 and 115 (`fgm.append(createFile(...))`) depending whether the pathname are "/to_pdf" or "/to_merge".

Worth to comment Lines 125 to 140, `if (!sessionStorage.getItem("newFile"))...else...` which are used for keeping the added files in the web page (in the preparation room) if the user reloads the page.

Finally, the files are inserted in the DOM and the function `shrinkText()` is called to shrink the name of the files if there are longer than 'n' characters.

The **`dragDrop()`** function will run once the user starts moving files around to create a custom order. It uses `element.addEventListener()`s to listen for Drag and Drop Events.

The **`readPDF()`** implements a PDF reader using the [PDF.js](https://mozilla.github.io/pdf.js/) library. This function is divided into two "sections", Design and Functionality.

*Design*: Lines 293 to 313 are used to manipulate the cursor's icon and the text selection ability . The cursor will change to a *hand* if the **Move tool** is selected and at the same the text layer on top of the image layer will be hidden, allowing to move the document without interacting with the text.

*Functionality*: Starting Line 315 is where the PDF reader is really implemented. The code is quite straightfoward and it has comments all around.

Worth commenting Line 323 `const INIT_SCALE = 96 / 72`. The *initial scale* seems random but what it actually means is that to get the correct scale or to render the PDF with the correct scale we need to divide the by-default resolution of an HTML/CSS document (96px) by the by-default resolution of the PDF (72px) getting the correct scale to render the PDF at the 100% resolution.

Later in the code we found `renderPDF()` function, which you can find in the helper.js file where is well documented.

To configure and render the PDF (Lines 339 to 446) and due to this not being a instant task, an `async` function `const pdfReader = async (doc){...}` was used. As an overall, the function receives a loaded PDF document (*doc*) and then calls the function `renderPDF(pdf, INIT_SCALE)` to render the document inside a container which is called *viewer*.

In addition, inside these lines, several event listeners are used to zoom in and zoom out whether by clicking on the buttons or by holding *Control* key and using the *mouse wheel*. Everytime the user zoom in or zoom out, a new zoom value will be passed to the `renderPDF()` function. In the Line 351 the variable `let zoom_val = INIT_SCALE` is declared, so everytime the user uses the zoom a custom scale is passed to this variable which will add or subtract `0.33` to the `zoom_val` variable scaling the document.

Worth commenting Line 421, where at the end of the event listener is `}, {passive: false})`, which is used to prevent the by-default behavior when *Control + mouse wheel* is used in the browser, so by doing this you can use your own instructions overwriting the ones from the browser.

> Note: Because of the way the zoom is implemented, it takes a few ms to update.

Finally, the **Move tool** was created which listen for the *"mousedown"* event to listen for the click and hold of the left click. Once the user clicks, the position of the mouse is get and a variable is set to `true`, this variable will only be true if the hand tool was selected. Once the user moves the mouse, the program will compute the position of the mouse and the current position of the document setting the `top` and `left` attributes of the *viewer element* moving the document around.

The **`getNewFilesIfReload()`** will get the files from the `sessionStorage` (if any) if the user reloads the web page.

The **`index()`** will run only in the index.html file, this function is used to control the behavior of the operation buttons.

The **helper.js** file is where all the helper functions are, and all these functions are well documented in the script.

The **style.js** file is used for setting the correct year at the bottom of the website (`getYear()`). In addition, the function `shrinkText()` will be called to shrink the filenames of the files in the *standby.html* file (preparation room) and finally, it will dynamically get the height of the viewport (`getHeight()`) to set the height of the loading screen.

## **Backend**
There are two main files here that worth explaining; *the app.py* file and the *helper.py* file. To manipulate the PDFs the [PyMuPDF 1.23.8](https://pypi.org/project/PyMuPDF/) library was used.

### app.py overview
This file uses several functions to control the backend behavior. 

In the Line 20, a temporal folder is created to store the uploaded files. These files will be store inside a custom folder which name is a random UUID. For instance, once a user uploads a document to operate it, inside the temp folder another folder will be created and the path to the file will be `./temp/<UUID>/<filename>`. The function that controls the creation of the UUIDs is `new_user(..)` which you can see in the *app.py* (and will be explained in the *helper.py*) as a decorator (`@new_user`).

#### Functions overview:
The `index()` will serve the *index.html template* through the `rendedr_template()` method sending also as argument a variable called `donwload` which will be `False` if there is nothing to download or `True` if there is a file ready to be download.

The `to_pdf(op=None)` will receive as argument a variable called `op` which is set to `None` by default. This function will be called when the user chooses to convert images in PDF. When the client (or browser) uploads the file(s) (meaning the form is submitted) the previous files (if any) the user might have had in his/her personal folder (calling `remove_temp(...)` in Line 61) will be removed.

In Line 72, the `validate_img(...)` function is called from the *helper.py* file to validate if the uploaded file is indeed an image (of the supported format), this function returns a `dictionary` which will be either empty or filled with images (more information in *helper.py*).

In Line 80 the `dictionary` is saved in a session variable called "files" (`session["files]`) to then redirect the user and render the *standby.html template* passing the variables `redirect`, `operation` and `title` (which were explained in the HTML section from the Frontend).

Once the user clicks on the operation button ("Convert"), this same function will be called but now `op` will be `"convert"` and it is when the library `fitz` is used.

In the Line 100, the indexes of all the images that were in the preparation room (`imgs_idx = request.form.getlist('pdf')`) are get, later the app checks if new images were added and if so, a new `dictionary` is created where the indexes are the `keys` (`img_key_idx = {file["id"]: file for file in session["files"]}`), once this new `dictionary` is created, the files will be ordered as per the user's input meaning that, the files will be ordered as per the user's custom order (Line 121).

Finally, in Line 128, using the `fitz` library, a new PDF document is created containing the images (the steps are very straighfoward and it is well commented). The file is saved in the user folder (Line 158), and the `session["donwload"]` session variable set to `True`.

The `to_merge(op=None)` function is pretty similar to the function previously described, as you go deep into the code you'll see that the only variation worth to describe is Line 225 where instead of calling `validate_img(...)` we declare a variable and call the function to validate PDFs`new_valid_pdfs = validate_pdf(...)`.

In Line 251, the `fitz` library was used again to create the PDF pages. First, in Line 248 `pdf_one = fitz.open(user_files[0]["filepath"])` one of the PDFs is opened and then, in Line 251 each other PDF documents are inserted in `pdf_one` variable. Lastly, the new PDF is saved in the user folder (Line 261), and the `session["donwload"]` session variable set to `True`.

The `to_split(op=None)` is almost equally in code as the function `to_merge(op=None)`. 

First the user uploads a document to operate, then the `validate_pdf(...)` is used to check if this is a PDF document and, lastly, the user is redirected to the *split* page where he/she can split the document.

Once the user is ready to split the PDF, the inputs `from` and `to` are get, both inputs are checked, converted into `integers` and it is when the `fitz` library is used again to extract the pages from the document.

The conditional that were used to extract the pages are well commented in the *.py* file.

Finally, in Line 389, a *zip* file is created using the `zipfile` library to download both the extracted and the modified documents.

The `get_pdf(doc=None)` is used for the *Frontend* javascript `fetch` method to get the document and display it in the split.html template.

The `download_file()` is used, along with the `index()` and the `download` variable to download the documents.

### helper.py overview
This file uses several functions to help the app.py control the backend behavior. Most of these functions are well explain on the file but a function overview will be given.

#### Functions overview:
The `new_user(f)` is a wrapper function to help create unique user IDs for the users once they start an operation. If the user navigates to a page and the server doesn't have his/her user ID, it will be redirected and assigned an ID.

The `remove_temp(temp_folder)` will delete temporal files inside the user unique temporal folder, (i.e. `./temp/<user_id>/`).

The `validate_img(upload_folder, fileStorage, starting_id = 0)` will receive three parameters: `upload folder path`, the `fileStorage` (i.e. the uploaded images) and optionally, the starting id where any value different from 0 means the starting id will be the length of `session["files"]` which is useful for those new added files once in the operation room.

As the name suggest it will validate if the user file is a valid image and if so, it will validate the format.

In addition, it will save both the file path in a variable (`valid_imgs`), and the file in the server in the user unique folder.

The return value is a list which can be empty if there isn't an image fitting with the available formats or it can be a `dictionary` containing the ID, the filename and the filepath.

The `validate_pdf(upload_folder, fileStorage, starting_id = 0)` is much alike with `validate_pdf` where the only difference is that it will check if the first five bytes of the document match the magic number of a PDF (i.e. `"%PDF-"`). The rest of the function is equal to `validate_pdf`.

