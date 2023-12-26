import glob, os, zipfile
from helper import new_user, remove_temp, validate_img, validate_pdf

# Import Flask class and a few usefull properties and methods
from flask import flash, Flask, request, render_template, redirect, send_file, session, send_from_directory, url_for

# Import PDF library for handling PDFs
import fitz

# Create Flask application
app = Flask(__name__)

# Get secret key
app.secret_key = os.getenv("SECRET_KEY")

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Set temporary folder
app.config["UPLOAD_FOLDER"] = "./temp"

@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@new_user
def index():
    '''Serve homepage'''

    # Set download to false (this will display the Download modal when true)
    download = False
    try:
        if session["download"] == True:
            download = True
    except KeyError:
        session["download"] = False

    # Clear the images the user had selected
    session.pop("files", None)

    return render_template("index.html", download=download)


@app.route("/to_pdf", methods=["GET", "POST"])
@app.route("/to_pdf/<string:op>", methods=["POST"])
@new_user
def to_pdf(op=None):
    '''Convert Imgs to PDF'''

    # User is comming from homepage
    if op == None:
        # POST
        if request.method == "POST":
            # Clean temp folder
            remove_temp(app.config["UPLOAD_FOLDER"])

            # Get the imgs (as FileStorage)
            imgs = request.files.getlist('pdf')

            # Check for empty input
            if not imgs:
                flash("File not found")
                return redirect(url_for("index"))
            
            # Check if the file is valid
            valid_imgs = validate_img(app.config["UPLOAD_FOLDER"], imgs)

            # Check for valid imgs to convert
            if len(valid_imgs) == 0:
                flash("Please try again")
                return redirect(url_for("index"))

            # Store images id and name (for displaying in the HTML)
            session["files"] = valid_imgs

            # Imgs OK request GET method
            return redirect(url_for("to_pdf"))
        
        # GET
        else:
            # Check if user is still in the same webpage
            if session["files"][0]["format"] != "image":
                flash("Invalid files")
                return redirect(url_for("index"))

            return render_template("standby.html", redirect= "to_pdf/convert", operation= "Convert", title= "Convert to PDF")

    # Start conversion
    elif op == "convert":
        # Create new PDF document
        new_pdf = fitz.open()

        # Get the index of the images from the form
        imgs_idx = request.form.getlist('pdf')        

        # Look for new elements
        if len(imgs_idx) > len(session["files"]):
            # Get the new images
            new_imgs = request.files.getlist("added_files")

            # Validate the images and stored them in the servers' disk
            new_valid_imgs = validate_img(app.config["UPLOAD_FOLDER"], new_imgs, 1)

            # Insert new images into session["files"]
            for new_valid_img in new_valid_imgs:
                session["files"].append(new_valid_img)

        # Create dictionary with index as keys
        img_key_idx = {file["id"]: file for file in session["files"]}

        # Restart session["files"]
        session["files"] = []

        # Save sorted images as per input
        for idx in imgs_idx:
            session["files"].append(img_key_idx[int(idx)])

        # Set the user forlder
        userfolder = os.path.join(app.config["UPLOAD_FOLDER"], str(session["user_id"]))
        
        # Iterate over each file (dictionary)
        for file in session["files"]:

            try:
                # Open the image to read from
                current_img = fitz.open(file["filepath"])

                # Get image dimensions
                img_dim = current_img[0].rect
                
                # Create a PDF stream
                pdf_stream = current_img.convert_to_pdf()

                # Open the stream as a PDF doc
                pdf_img = fitz.open("pdf", pdf_stream)

                # Create new page with image dimensions
                page = new_pdf.new_page(
                    width=img_dim.width,
                    height=img_dim.height
                    )

                # "Draw" the image in the page
                page.show_pdf_page(img_dim, pdf_img, 0)

            except Exception as e:
                print(e)
                flash("Error converting the images to PDF")
                return redirect(url_for("to_pdf"))
        
        # Save the PDF in the user's folder
        new_pdf.save(userfolder + "/output.pdf")

        # Set download to True to download the file
        session["download"] = True

        # Set MIME type
        session["MIME"] = "pdf"

        # Return to homepage
        return redirect(url_for("index"))


@app.route("/to_merge", methods=["GET", "POST"])
@app.route("/to_merge/<string:op>", methods=["POST"])
@new_user
def to_merge(op=None):
    '''Merge PDFs'''

    # User is comming from homepage
    if op == None:
        # POST
        if request.method == "POST":
            # Clean temp folder
            remove_temp(app.config["UPLOAD_FOLDER"])

            # Get the PDFs (as FileStorage)
            pdfs = request.files.getlist("merge")

            # Check for empty input
            if not pdfs or len(pdfs) == 1:
                flash("Invalid number of files")
                return redirect(url_for("index"))
            
            # Check for valid format (returns a list of dict)
            valid_pdfs = validate_pdf(app.config["UPLOAD_FOLDER"], pdfs)

            # Check for valid PDF to merge
            if len(valid_pdfs) == 0:
                flash("Invalid number of PDFs")
                return redirect(url_for("index"))

            # Store PDFs id and name (for displaying in the HTML)
            session["files"] = valid_pdfs

            return redirect(url_for("to_merge"))
        
        # GET
        else:
            # Check if user is still in the same web page
            if session["files"][0]["format"] != "pdf":
                flash("Invalid files")
                return redirect(url_for("index"))

            return render_template("/standby.html", redirect= "to_merge/merge", operation= "Merge", title= "Merge PDF")

    # Start mergin   
    elif op == "merge":

        # Get the IDs from the standby room
        pdfs_id = request.form.getlist("pdf")

        # Look for new added files
        if len(pdfs_id) > len(session["files"]):
            # Get the new files
            new_added_pdfs = request.files.getlist("added_files")

            # Validate new PDF files
            new_valid_pdfs = validate_pdf(app.config["UPLOAD_FOLDER"], new_added_pdfs, 1)

            # Add PDFs to session["files"]
            for new_file in new_valid_pdfs:
               session["files"].append(new_file) 

        # Create a dictionary where each key is the ID of the file
        files = {file["id"]: file for file in session["files"]}

        # Store the user custom order (to maintain files ordered) (later)
        user_files = []

        # Set custom order
        for index in pdfs_id:
            # If user doesn't play fair (By changing the id)
            try:
                user_files.append(files[str(index)])
            except:
                flash("Impossible to complete the task")
                return redirect(url_for("to_merge"))

        # Merge PDFs #
        # Open first PDF
        pdf_one = fitz.open(user_files[0]["filepath"])

        # Iterate the files (starting from the second PDF) inserting them into pdf_one
        for pdf_idx in range(1, len(user_files)):
            try:
                next_pdf = fitz.open(user_files[pdf_idx]["filepath"])
                pdf_one.insert_file(next_pdf)
            except:
                flash("Error while inserting the PDFs")
                return redirect(url_for("index"))

        # Save the PDF in the user's folder
        user_folder = os.path.join(app.config["UPLOAD_FOLDER"], str(session["user_id"]))
        pdf_one.save(user_folder + "/output.pdf")

        # Set download to True to download the file
        session["download"] = True

        # Set MIME type
        session["MIME"] = "pdf"

        # Return to homepage
        return redirect(url_for("index"))
        

@app.route("/to_split", methods=["GET", "POST"])
@app.route("/to_split/<string:op>", methods=["POST"])
@new_user
def to_split(op=None):
    '''
    Split PDFs or Extract Pages:
    You can split the PDF in half or select an exact number of pages
    you want to extract
    '''

    # User is comming from homepage
    if op == None:
        # POST
        if request.method == "POST":
            # Clean files from temp folder
            remove_temp(app.config["UPLOAD_FOLDER"])

            # Get the PDF (from user input)
            pdf = request.files.getlist("split")

            # Check if the input is empty
            if not pdf or len(pdf) > 1:
                flash("Invalid number of files")
                return redirect(url_for("index"))
            
            # Validate PDF
            valid_pdf = validate_pdf(app.config["UPLOAD_FOLDER"], pdf)

            # Check if valid_pdf is empty
            if not valid_pdf:
                flash("File is not a PDF")
                return redirect(url_for("index"))
            
            # Check valid number of pages (i.e p < 2)
            if len(fitz.open(valid_pdf[0]["filepath"])) == 1:
                flash("Your PDF only have 1 page")
                return redirect(url_for("index"))
            
            # Store PDFs id and name (for displaying in the HTML)
            session["files"] = valid_pdf

            return redirect(url_for("to_split"))
        
        # GET
        else:
            # Check if user is still in the same web page
            if session["files"][0]["format"] != "pdf":
                flash("Invalid files")
                return redirect(url_for("index"))
            
            return render_template("/split.html", redirect="to_split/split")

    elif op == "split":

        # Get "from" and "to" inputs
        start_page = request.form.get("from")
        end_page = request.form.get("to")

        # Validate that both are numbers and postive
        if not start_page.isdigit() or not end_page.isdigit():
            flash("Not a valid range")
            return redirect(url_for("to_split"))
        
        # Convert range to int
        start_page = int(start_page)
        end_page = int(end_page)

        # Get the original's PDF filepath
        filepath = session["files"][0]["filepath"]

        # Open PDF
        original_pdf = fitz.open(filepath)

        # Get number of pages
        total = original_pdf.page_count

        # Check ranges
        # (Invalid) General (i.e: x == 0, y == 0)
        if start_page == 0 or end_page == 0:
            flash("Invalid range")
            return redirect(url_for("to_split"))

        # (Invalid) General (i.e: x > total, y > total)
        if start_page > total or end_page > total:
            flash(f"There is only {total} pages in this PDF")
            return redirect(url_for("to_split"))
        
        # (Invalid) Extracting the document as is
        if start_page == 1 and end_page == total:
            flash("You are trying to extract the document as is.")
            return redirect(url_for("to_split"))
        
        # (Valid) Setting end_page to last page
        if end_page - start_page < 0:
            end_page = total

        # Create empty PDF
        new_pdf = fitz.open()

        # Extracting and inserting pages in the new PDF
        new_pdf.insert_pdf(original_pdf, from_page=start_page - 1, to_page=end_page - 1)

        # Deleting extracted pages from the original PDF
        original_pdf.delete_pages(start_page - 1, end_page - 1)

        # Get user folder
        user_folder = os.path.join(app.config["UPLOAD_FOLDER"], str(session["user_id"]))

        # Remove base file
        remove_temp(app.config["UPLOAD_FOLDER"])

        # Save both PDFs
        new_pdf.save(user_folder + "/newPDF.pdf")
        original_pdf.save(user_folder + "/oldPDF.pdf")

        # Create a zip file
        pdfs_names = os.listdir(user_folder)
        with zipfile.ZipFile(user_folder + "/output.zip", "w") as zip:
            for filename in pdfs_names:
                zip.write(os.path.join(user_folder, filename), arcname=filename)

        # Set download to True to download the file
        session["download"] = True

        # Set MIME type
        session["MIME"] = "zip"

        return redirect(url_for("index"))


@app.route("/get_pdf/<string:doc>", methods=["GET"])
@new_user
def get_pdf(doc=None):
    if doc == session["files"][0]["name"]:
        return send_from_directory(os.path.join(app.config["UPLOAD_FOLDER"], str(session["user_id"])), session["files"][0]["name"])


@app.route("/download")
@new_user
def download_file():
    '''Download files'''

    # Set MIME type
    mimetype = session["MIME"]

    # Keep showing the Download modal until the user downloads the file 
    session["download"] = False

    # Clear MIME type (just in case)
    session.pop("MIME", None)

    # Set filepath
    file_to_download = glob.glob(os.path.join(app.config["UPLOAD_FOLDER"], str(session["user_id"]), "output.*"))

    # Download file
    return send_file(file_to_download[0], as_attachment=True, mimetype=f"application/{mimetype}")



        
    
        

            