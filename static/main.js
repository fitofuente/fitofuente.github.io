'use strict'
// Import helper functions
import {createFile, renderPDF, shrinkText, wait_fp, wait_file, wait} from "./helper.js"

// Get the current URL to execute proper functions
let url_pathname = document.location.pathname

// Run functions
document.addEventListener("DOMContentLoaded", ()=>{
    if (url_pathname == "/")
    {
        index()
    }
    else if (url_pathname == "/to_merge" || url_pathname == "/to_pdf")
    {
        try
        {
            // Load previously created files (if any)
            getNewFilesIfReload()

            // Add files by pressing on the plus icon
            addFiles()

            // Reorder the files
            dragDrop()
        }
        catch
        {            
            alert("Error. Please try again.")
        }
    }
    else if (url_pathname == "/to_split")
    {
        readPDF()
    }
})


/** Add HTML elements by creating them dynamically.
*/
function addFiles()
{
    // Capture file container (which has the input) and the button
    const file_container = document.querySelector("#file_container")
    const bttn_add_files = document.querySelector("#bttn_add_files")
    
    // Capture the fail msg container
    const fail_msg = document.querySelector("#fail_msg")

    // Display File Picker
    bttn_add_files.addEventListener("click", async ()=>{

        // Set the hidden input
        const file_input = file_container.children["added_files"]

        // Clear file_input files
        file_input.value = ""

        // Click on the input to open the FP
        file_input.click()

        // Wait for the FP to show up
        await wait_fp()

        // Waiting for a file (if any)
        await wait_file(file_container, "added_files")

        // Check for empty input
        if (file_input.files.length == 0)
        {
            return
        }

        /* Checking PDFs format */
        // Store invalid formats (if any) (later)
        const invalid_format = []

        // Set uploaded files
        const new_files = file_input.files

        // Create filetype (later)
        let filetype = null

        // Fragment
        let fgm = document.createDocumentFragment()

        // Get the pos of file container's last file (-2 because of the input and the button)
        let last_pos = file_container.childElementCount - 2

        // Check each file format, create the elements and insert them in the fragment
        for (let idx = 0; idx < new_files.length; idx++)
        {
            // Check PDF merging operation
            if (url_pathname == "/to_merge")
            {
                // Check file format
                if (new_files[idx].type == "application/pdf")
                {
                    filetype = "pdf"
                    fgm.append(createFile(new_files[idx].name, last_pos, "pdf"))
                }
                else
                {
                    invalid_format.push(new_files[idx].name)
                    continue
                }
            }
            // Check convert operation
            else if (url_pathname == "/to_pdf")
            {
                // Check file format
                if (new_files[idx].type.includes("image/"))
                {
                    filetype = "image"
                    fgm.append(createFile(new_files[idx].name, last_pos, "image"))
                }
                else
                {
                    invalid_format.push(new_files[idx].name)
                    continue
                }
            }

            // Save new files in a sessionStorage variable
            if (!sessionStorage.getItem("newFile"))
            {
                // Create the sessionStorage and save the first file
                sessionStorage.setItem("newFile", JSON.stringify([{"file": new_files[idx], "file_name": new_files[idx].name, "last_pos": last_pos, "filetype": filetype}]))
            }
            else
            {
                // Convert from string to an =array of objects ([{}, {}, etc])
                const files_data = JSON.parse(sessionStorage.getItem("newFile"))

                // Add new files to the array
                files_data.push({"file_name": new_files[idx].name, "last_pos": last_pos, "filetype": filetype})

                // Store in sessionStorage
                sessionStorage.setItem("newFile", JSON.stringify(files_data))
            }

            // Increment Last position
            last_pos++

        } // END of for loop

        // Show not supported files (if any)
        if (invalid_format.length > 0)
        {
            fail_msg.style.display = ""
            fail_msg.textContent =  "File not valid: "
            invalid_format.forEach(file=>{
                fail_msg.textContent += file + " "
            })
            // Remove fail msg after 3 seconds
            await wait(3)
            fail_msg.style.display = "none"
        }

        // Insert the files in the DOM
        file_container.insertBefore(fgm, file_input)

        // Shrink text
        shrinkText()
    }) // END of Click Event
}


/**
 * Dragging and Dropping event. 
 * 
 * This function will run once the user starts moving files
 * around to create a custom order.
 */
function dragDrop()
{
    // Get the container
    const file_container = document.querySelector("#file_container")

    // Store dragged file and df position (later)
    let dragged_file = null

    /* Drag n Drop trial */
    // DragStart
    file_container.addEventListener("dragstart", (ev)=>{
        if (ev.target.attributes.draggable)
        {
            // Set dragged file
            dragged_file = ev.target

            // Set styles to simulate file selection
            dragged_file.classList.add("ds_waiting_file")

            // Change cursor to move icon
            ev.dataTransfer.effectAllowed = "move"
        }
    })

    // Allow dropping files by preventing dragover event
    file_container.addEventListener("dragover", (ev)=>{ev.preventDefault()})

    // DragEnter
    file_container.addEventListener("dragenter", (ev)=>{
        if (ev.target.attributes.draggable)
        {
            if (ev.target != dragged_file)
            {
                // Simulate hover
                ev.target.classList.add("de_hover_simulation")
            }
        }
    })

    // Dragleave
    file_container.addEventListener("dragleave", (ev)=>{
        if (ev.target.attributes.draggable)
        {
            // Remove hover simulation
            ev.target.classList.remove("de_hover_simulation")
        }
    })

    // DragEnd
    file_container.addEventListener('dragend', (ev)=>{
        if (ev.target.attributes.draggable)
        {
            // Remove file selection simulation
            dragged_file.classList.remove("ds_waiting_file")
        }
    });

    // Drop
    file_container.addEventListener("drop", async (ev)=>{
        if (ev.target.attributes.draggable)
        {
            // Clean hover simulations
            ev.target.classList.remove("de_hover_simulation")

            /* For contigious files: */
            // Is dragged file before hover file?
            if (dragged_file.nextElementSibling == ev.target)
            {                
                // Insert dragged file after hover file
                file_container.insertBefore(dragged_file, ev.target.nextElementSibling)
            }

            // Is dragged file after the hover file?
            else if (dragged_file.previousElementSibling == ev.target)
            {
                file_container.insertBefore(dragged_file, ev.target)
            }

            /* For non-contigious files: */
            else
            {                
                // Save dragged file next sibling
                const next_sibling = dragged_file.nextElementSibling
    
                // Insert dragged file after the hover file
                file_container.insertBefore(dragged_file, ev.target.nextElementSibling)
    
                // Insert hover file after the dragged file's original pos
                file_container.insertBefore(ev.target, next_sibling)
            }
    
            // Simulate success
            if (dragged_file != ev.target)
            {
                dragged_file.classList.add("d_success")
                await wait(0.12)
                dragged_file.classList.remove("d_success")
            }
        }
        else
        {
            dragged_file.classList.add("d_fail")
            await wait(0.12)
            dragged_file.classList.remove("d_fail")
        }  
    })
    /* Drag n Drop ends */
}


/** Read a PDF document.
 * 
 *  Because of the way the zoom is implemented, it takes a few ms to update.
 */
async function readPDF()
{
    /* Design START */
    // Capture the General Tools
    const general_tool = document.querySelector("#general_panel")

    // Capture the viewer
    const viewer = document.querySelector("#viewer")

    // Open custom text panel and move PDF
    general_tool.addEventListener("click", (ev)=>{
        // Move PDF arround
        if (ev.target.id == "bttn_move")
        {
            // Show hand
            document.body.classList.toggle("set_move")

            // Hide the text layer (dragging illusion)
            for(let txt_layer of document.querySelectorAll(".text_layer"))
            {
                txt_layer.classList.toggle("d_none")
            }
        }
    })
    /* Design END */

    /* PDF Reader START */
    // Get PDF.js library
    const { pdfjsLib } = globalThis
    
    // Set worker location
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.269/pdf.worker.min.mjs"

    // Initial Scale (96 px / 72px = 1.33)
    const INIT_SCALE = 96 / 72

    // Get the PDF document
    const pdf_file = await fetch("/get_pdf/" + sessionStorage.getItem("filename"))

    // Check if the document was loaded (fetch)
    if (pdf_file.ok == false)
    {
        alert("PDF could not be loaded")
        window.location.href = ("/")
    }

    // Load PDF Document
    const loaded_pdf = await pdfjsLib.getDocument(pdf_file)

    // Configure PDF Reader (add zoom functionality also)
    const pdfReader = async (doc)=>{

        // Get PDF Document
        const pdf = await doc.promise

        // Initial Render
        viewer.append(await renderPDF(pdf, INIT_SCALE))

        /* Zoom in */
        const zoom_in = document.querySelector("#bttn_zoom_in")

        // Set initial zoom value
        let zoom_val = INIT_SCALE

        zoom_in.addEventListener("click", async(e)=>{
            // Check if annotation layer has something

            zoom_val += 0.33
            viewer.replaceChildren(await renderPDF(pdf, zoom_val))

            // Check if the hand is set
            if (document.body.classList.contains("set_move"))
            {
                // Hide the text layer (dragging illusion)
                for(let txt_layer of document.querySelectorAll(".text_layer"))
                {
                    txt_layer.classList.add("d_none")
                } 
            }
        })

        /* Zoom out */
        const zoom_out = document.querySelector("#bttn_zoom_out")

        zoom_out.addEventListener("click", async()=>{
            zoom_val -= 0.33
            viewer.replaceChildren(await renderPDF(pdf, zoom_val))

            // Check if the hand is set
            if (document.body.classList.contains("set_move"))
            {
                // Hide the text layer (dragging illusion)
                for(let txt_layer of document.querySelectorAll(".text_layer"))
                {
                    txt_layer.classList.add("d_none")
                } 
            }
        })

        // Get scrollable element
        const viewer_container = document.querySelector("#viewer_container")

        // Zoom by CTRL + Wheel
        viewer_container.addEventListener("wheel", async (ev)=>{
            if (ev.ctrlKey)
            {
                // Preventing browser default zoom event
                ev.preventDefault()

                // Zooming out
                if (ev.deltaY > 0)
                {
                    zoom_val -= 0.33
                    viewer.replaceChildren(await renderPDF(pdf, zoom_val))
                }
                // Zooming in
                else
                {
                    zoom_val += 0.33
                    viewer.replaceChildren(await renderPDF(pdf, zoom_val))    
                }

                // Check if the hand is set
                if (document.body.classList.contains("set_move"))
                {
                    // Hide the text layer (dragging illusion)
                    for(let txt_layer of document.querySelectorAll(".text_layer"))
                    {
                        txt_layer.classList.add("d_none")
                    } 
                }
            }
        }, {passive: false})

        /* Restart zoom and doc pos */
        // Capture the button
        const fix_zoom = document.querySelector("#bttn_fix_zoom")

        fix_zoom.addEventListener("click", async ()=>{
            // Restart zoom
            viewer.replaceChildren(await renderPDF(pdf, INIT_SCALE))
            zoom_val = INIT_SCALE

            // Restart position
            viewer.style.top = "0px"
            viewer.style.left = "0px"

            // Check if the hand is set
            if (document.body.classList.contains("set_move"))
            {
                // Hide the text layer (dragging illusion)
                for(let txt_layer of document.querySelectorAll(".text_layer"))
                {
                    txt_layer.classList.add("d_none")
                } 
            }
        })
    }

    // Read the PDF
    await pdfReader(loaded_pdf)

    /* Move document tool */
    // let doc_pos = document.body.clientHeight -
    let client_x = null
    let client_y = null

    // Is move active?
    let moving = false

    // Check left click pressed
    viewer.addEventListener("mousedown", (ev)=>{
        // Is user using the hand tool?
        if (document.body.classList.contains("set_move"))
        {
            // Get mouse position
            client_x = ev.clientX
            client_y = ev.clientY
            moving = true
        }
    })

    // Is mouse moving
    viewer.addEventListener("mousemove", (ev)=>{
        if (moving)
        {
            // Parse viewer positions
            let top = Math.round(parseFloat(viewer.style.top))
            let left = Math.round(parseFloat(viewer.style.left))

            /* Compute positions */
            // Down and Up
            if (ev.clientY > client_y)
            {
                // Going down
                viewer.style.top = (top + (ev.clientY - client_y)).toString() + "px"

                // Update current position
                client_y = ev.clientY
            }
            else if (ev.clientY < client_y)
            {
                // Going up
                viewer.style.top = (top - (Math.abs(ev.clientY - client_y))).toString() + "px"

                // Update current position
                client_y = ev.clientY
            }
            // Right and Left
            if (ev.clientX > client_x)
            {
                // Going right
                viewer.style.left = (left + (ev.clientX - client_x)).toString() + "px"

                // Update current position
                client_x = ev.clientX
            }
            else if (ev.clientX < client_x)
            {
                // Going left
                viewer.style.left = (left - Math.abs((ev.clientX - client_x))).toString() + "px"

                // Update current position
                client_x = ev.clientX
            }
        }
    })

    // Is action finished
    window.addEventListener("mouseup", ()=>{if (moving){moving = false}})    
}


/** Get newly created files from the sessionStorage
 * if the user reloads the web page */
function getNewFilesIfReload()
{
    // Capture the hidden input
    const file_input = document.querySelector("[name=added_files]")

    // Fragment
    let fgm = document.createDocumentFragment()

    // Check if the key newFile was created (files were added)
    if (sessionStorage.getItem("newFile"))
    {
        // // Get the files (array of objects)
        const newFiles = JSON.parse(sessionStorage.getItem("newFile"))

        newFiles.forEach(file=>{
            fgm.append(createFile(file.file_name, file.last_pos, file.filetype))
        })

        // Insert files
        file_input.parentElement.insertBefore(fgm, file_input)
    }
}


/**
 * Will run only in index.html as this is
 * only for the form to add files for the
 * operations.
 */
function index()
{
    // Clean sessionStorage (this variable stores the 
    // new files added through the add button in the stndy.html)
    if (sessionStorage.getItem("newFile"))
    {
        sessionStorage.clear()
    }

    // Capture the form
    const form = document.querySelector("#form_to_pdf")

    /* Click event for Convert and Merge operations */
    form.addEventListener("click", async(e)=>{
        if (e.target.nodeName == "BUTTON")
        {
            // Storing the button ID and adding the prefix (to_)
            let bttn_id = "to_" + e.target.id

            // Open File Picker per the correct operation (Convert or Merge)
            form.children[bttn_id].click()

            // Show loading screen
            const loading_screen = document.querySelector("#load_sc")
            loading_screen.classList.remove("loading_screen_hide")

            // Wait for FP to display
            await wait_fp()

            // Waiting for a file (if any)
            await wait_file(form, bttn_id)

            // Check if the user selected a file
            if (form.children[bttn_id].files.length == 0)
            {
                // Hide loading screen
                loading_screen.classList.add("loading_screen_hide")
            }
            else if (form.children[bttn_id].files.length > 0)
            {
                // Handle the operation
                form.action = "/" + bttn_id
                form.submit()
            }
        }
    }) // END OF CLICK EVENT

    /* User drops the file(s) (Convert to or merge) */
    form.addEventListener("dragover", (e)=>{e.preventDefault()}) // This makes possible for the drop event to work

    form.addEventListener("drop", async(e)=>{
        if (e.target.nodeName == "BUTTON")
        {
            // Storing the button ID and adding the prefix (to_)
            let bttn_id = "to_" + e.target.id

            // Uploading the file
            form.children[bttn_id].files = e.dataTransfer.files

            // Submit the form
            form.action = "/" + bttn_id
            form.submit()
        }

        // Prevent to open a new tab
        e.preventDefault()
    }) // END OF DROP EVENT    
}





