import os, glob, uuid

from flask import flash, redirect, session
from functools import wraps
from PIL import Image
from werkzeug.utils import secure_filename


# Create a user ID
def new_user(f):
    '''
    Create a unique user_id for new comers.
    Redirect user without IDs.
    '''
    @wraps(f)
    def dec_function(*args, **kwargs):
        try:
            session["user_id"]
            return f(*args, **kwargs)

        except KeyError:
            session["user_id"] = uuid.uuid4()
            return redirect("/")

    return dec_function


# Remove temporal files
def remove_temp(temp_folder):
    '''
    Remove temporal files
    '''
    files = glob.glob(temp_folder + "/" + str(session["user_id"]) + "/*")
    for file in files:
        os.remove(file)


# Validate Imgs
def validate_img(upload_folder, fileStorage, starting_id = 0):
    '''
    This function will receive three parameters: upload folder path, the fileStorage (Uploaded Images)
    and as an option, the starting id (any value != 0 means the starting id will be the length of session["files"])

    It will validate if the user file is a valid image
    and if so, it will validate the format.

    In addition, it will save both the file path in a variable (valid_imgs),
    and the file itself temporarily in the server's disk.

    This function returns a list of dictionaries with the ID, the filename and the filepath
    or (in case of no valid images) an empty list.
    '''

    # Store valid Imgs
    valid_imgs = []

    # Set the valid IMG formats
    valid_formats = ["JPG", "JPEG", "PNG", "BMP", "GIF", "TIFF"]

    # Set starting id
    if starting_id != 0:
        starting_id = len(session["files"])

    # Iterate over the FileStorage list opening the images
    for idx, img in enumerate(fileStorage, starting_id):
        # Check if user sends only imgs
        try:
            # Open each image
            with Image.open(img) as i:
                if i.format not in valid_formats:
                    flash(f"Format: {i.format} is not supported")
                    continue
                else:
                    # Creating a secure name for the file
                    filename = secure_filename(img.filename)

                    # Setting the user's own folder
                    user_folder = os.path.join(upload_folder, str(session["user_id"]))
                    if not os.path.exists(user_folder):
                        os.mkdir(user_folder)

                    path_to_file = os.path.join(user_folder, filename)

                    # Save the opened file in the server's disk
                    try:
                        i.save(path_to_file)
                    except (IOError, OSError):
                        flash("Not enough space to store the files")
                        return []

                    # Save data to return
                    valid_imgs.append({"id": idx, "name": img.filename, "filepath": path_to_file, "format": "image"})
        except Exception as e:
            flash(f"File: {img.filename} is not supported")
            continue
    
    # Return the list of valid images (if any)
    return valid_imgs


# Validate PDFs
def validate_pdf(upload_folder, fileStorage, starting_id = 0):
    '''
    This function will receive three parameters: upload folder path, the fileStorage (Uploaded PDFs)
    and as an option, the starting id (any value != 0  means the starting id will be the length of session["files"])

    It will validate if the user file is a PDF.

    In addition, it will save both the file path in a variable (valid_pdfs),
    and the file itself temporarily in the server's disk.

    This function returns a list of dictionaries with the ID, the filename and the filepath
    or (in case of no PDF) an empty list.
    '''

    # Store valid PDFs
    valid_pdfs = []

    pdf_sgt = b'%PDF-'

    # Set starting id
    if starting_id != 0:
        starting_id = len(session["files"])

    # Iterate over the PDFs
    for idx, pdf in enumerate(fileStorage, starting_id):

        try:
            # Open and read the first 5 bytes of the file
            sgt = pdf.read(5)
            if sgt != pdf_sgt:
                flash(f"{pdf.filename} is not a PDF")
                return []
            else:
                # Creating a secure name for the file
                filename = secure_filename(pdf.filename)

                # Setting the user's folder
                user_folder = os.path.join(upload_folder, str(session["user_id"]))
                if not os.path.exists(user_folder):
                    os.mkdir(user_folder)
                
                # Set the path to the file
                path_to_file = os.path.join(user_folder, filename)

                # Save the PDF in disk
                pdf.save(path_to_file)

                # Store the id, name and filepath
                valid_pdfs.append({"id": str(idx), "name": filename, "filepath": path_to_file, "format": "pdf"})

        except:
            flash(f"File: {pdf.filename} is not supported")
            continue

    # Return the list of valid images (if any)
    return valid_pdfs


