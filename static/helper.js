'use strict'

/** Create HTML elements.
 * 
 * Upon adding new files, this function will be called
 * to add these files.
 * 
 * @param {string} file_name Name for textContent and the title attribute.
 * @param {integer} last_pos Position of the last file (stored in data-pos attribute).
 * @param {string} filetype File type (pdf or image).
 */
function createFile(file_name, last_pos, filetype)
{
    // Create files
    const col_file = document.createElement("DIV")
    col_file.classList.add("col_file")
    col_file.setAttribute("data-id", "file")
    col_file.setAttribute("data-new", "1")
    col_file.setAttribute("data-pos", last_pos)
    col_file.setAttribute("draggable", "true")
    col_file.setAttribute("title", file_name)

    // Children
    let icon = null
    if (filetype == "pdf")
    {
        icon = document.createElementNS("http://www.w3.org/2000/svg", "svg")
            icon.setAttribute("version", "1.1")
            icon.setAttribute("xmlns", "http://www.w3.org/2000/icon")
            icon.setAttribute("height", "34")
            icon.setAttribute("width", "38")
            icon.setAttribute("viewBox", "0 0 16 16")
    
            // Icon child
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
                path.setAttribute("fill", "#f8f8f8")
                path.setAttribute("d", "M0,2c0-1.1,0.9-2,2-2h5v4c0,0.6,0.4,1,1,1h4v4.5H5.5c-1.1,0-2,0.9-2,2V16H2c-1.1,0-2-0.9-2-2V2z M12,4H8V0L12,4z M5.6,11h1c1,0,1.7,0.8,1.7,1.8s-0.8,1.8-1.7,1.8H6.1v1c0,0.3-0.2,0.5-0.5,0.5s-0.5-0.2-0.5-0.5V14v-2.5C5.1,11.2,5.3,11,5.6,11zM6.6,13.5c0.4,0,0.8-0.3,0.8-0.8S7,12,6.6,12H6.1v1.5H6.6z M9,11.7C9,11.3,9.2,11,9.5,11h0.8c1.1,0,1.9,1.1,1.9,2.5S11.4,16,10.3,16H9.5C9.2,16,9,15.7,9,15.3V11.7z M10.2,12h-0.2c0,0-0.1,0-0.1,0l0,3h0.3c0.8,0,0.9-0.8,0.9-1.7C11.2,12.4,10.9,12,10.2,12z M13.6,11c-0.3,0-0.6,0.3-0.6,0.7v1.8c0,0,0,1.9,0,2.1c0,0.2,0.4,0.4,0.5,0.4s0.5-0.2,0.5-0.4c0-0.2,0-1.5,0-1.5h1c0.1,0,0.3-0.2,0.3-0.5c0-0.3-0.2-0.5-0.3-0.5h-1V12h1.6c0.2,0,0.3-0.2,0.3-0.6c0-0.2-0.1-0.4-0.3-0.4H13.6z")

        // Insert the path
        icon.append(path) 
    }
    else if (filetype == "image")
    {
        icon = document.createElement("I")
            icon.classList.add("fa-solid", "fa-image", "fa-xl", "imgs_ready")
    }

    const input = document.createElement("INPUT")
        input.setAttribute("name", "pdf")
        input.setAttribute("type", "hidden")
        input.setAttribute("value", last_pos)

    const name = document.createElement("P")
        name.setAttribute("data-id", "filename")
        name.setAttribute("data-pos", last_pos)
        name.textContent = file_name

    // Build the element
    col_file.append(icon, input, name)

    // Return the file
    return col_file
}


/** Render PDF pages.
 *  Iterate over the pages creating dynamically the HTML elements.
 * 
 *  This function receives two arguments: PDF document (pdf) and a Initial scale (1.33).
 * 
 *  On each iteration two HTML elements are created, a CANVAS containing the 
 *  PDF as image and a DIV containing the text layer.
 * 
 *  @param {PDFDocumentProxy} pdf - See https://mozilla.github.io/pdf.js/api/draft/index.html for more info
 *  @param {Number} scale - The initial scale is 96px / 72px (https://github.com/mozilla/pdf.js/issues/5628)
 *  @returns Promise which will resolve in a renderer document.
  */
function renderPDF(pdf, scale, zoom)
{
    return new Promise(async (response, rejection)=>{
        // Create document fragmet
        const fragment = document.createDocumentFragment()

        // Iterate the doc pages (getting the data)
        for (let n = 1, total = pdf.numPages; n <= total; n++)
        {
            try
            {
                // Get the page
                const pdf_page = await pdf.getPage(n)
    
                // Create the style attribute (later)
                let atte_style = ""
    
                // Create page container
                const page = document.createElement("DIV")
                    page.classList.add("page")
                    page.setAttribute("data-page-number", pdf_page.pageNumber)
    
                    // Create canvas wrapper
                    const canvas_wrapper = document.createElement("DIV")
                            canvas_wrapper.classList.add("canvas_wrapper")
    
                            // Create canvas
                            const canvas = document.createElement("CANVAS")
    
                                /* Canvas properties */
                                // Set pdf initial dimensions (scaled to 1)
                                const pdf_init_dim = pdf_page.getViewport({scale: 1})

                                // Set custom dimensions
                                let viewport = pdf_page.getViewport({scale: scale})

                                // HiDPI screen
                                const window_scale = window.devicePixelRatio || 1
                                const transform = window_scale !== 1 ? [window_scale, 0, 0, window_scale, 0, 0] : null

                                // Set canvas context
                                const ctx = canvas.getContext("2d")
    
                                // Set Canvas width and height
                                canvas.height = Math.floor(viewport.height * window_scale)
                                canvas.width = Math.floor(viewport.width * window_scale)

                                // Set Canvas (CSS) width and height
                                atte_style = `width: ${Math.floor(viewport.width)}px; height: ${Math.floor(viewport.height)}px`
                                canvas.setAttribute("style", atte_style)

                                // Set PAGE final property (width and height as per the PDF viewport)
                                atte_style = `width: ${scale * pdf_init_dim.width}px; height: ${scale * pdf_init_dim.height}px`
                                page.style = atte_style
    
                                // Render page
                                pdf_page.render({
                                    canvasContext: ctx,
                                    viewport: viewport,
                                    transform: transform,
                                })

                                canvas_wrapper.append(canvas)
    
                    // Create text layer container
                    const txtLayer_container = document.createElement("DIV")
                        txtLayer_container.classList.add("text_layer")
                        txtLayer_container.setAttribute("data-page_rotation", pdf_page.rotate)
                        txtLayer_container.setAttribute("style", atte_style)
    
                        // Create text for each element in the array
                        const { items, styles } = await pdf_page.getTextContent()
    
                        items.forEach(({ dir, fontName, height, str, transform, width })=>
                        {
                            if (str == "" && width == 0 && height == 0)
                            {
                                // Create a line break
                                const line_break = document.createElement("BR")
                                txtLayer_container.append(line_break)
                                
                            }
                            else if (width > 0 && height > 0)
                            {
                                const txt = document.createElement("SPAN")
                                txt.setAttribute("dir", dir)

                                /* Set values */
                                const left = Math.floor(transform[4] * parseFloat(scale.toFixed(2)))
                                const bottom = Math.floor(transform[5] * parseFloat(scale.toFixed(2)))
                                const f_size = Math.round(height * parseFloat(scale.toFixed(2)))

                                atte_style = `left: ${left}px;bottom: ${bottom}px;font-size: ${f_size}px;font-family: ${styles[fontName].fontFamily};line-height:${parseFloat((styles[fontName].ascent + Math.abs(styles[fontName].descent).toFixed(2)))};`

                                    // Check if there is more than 1 character
                                    if (str.length > 1)
                                    {
                                        atte_style = atte_style + "transform: scaleX(calc(1 - 0.065));"
                                    }

                                // Apply styles to the Span element
                                txt.setAttribute("style", atte_style)
                                txt.textContent = str
    
                                txtLayer_container.append(txt)
                            }
                        })

                // Create annotation later
                const annotation = document.createElement("DIV")
                    annotation.classList.add("annotation_editor")
                    annotation.classList.add("disabled")
                    annotation.classList.add("d_none")
                    annotation.style.width = `${Math.floor(viewport.width)}px`
                    annotation.style.height = `${Math.floor(viewport.height)}px`
                    annotation.style.fontSize = `calc(100px * ${scale})`

                // Insert Text Layer and the Canvas
                page.append(annotation, canvas_wrapper, txtLayer_container)
    
                // Insert in the fragment
                fragment.append(page)

            }
            catch
            {
                rejection(console.error("Impossible to render PDF pages"))
            }
        } // END For Loop

        // Return fragment
        response(fragment)

    }) // END Promise
} // END Function


/** Shrink filename.
 */
function shrinkText()
{
    // Get the file names (the <p> tags)
    const files_name = document.querySelectorAll("[data-id=filename]")

    // Store original filenames (for later)
    const original_fn = []

    // Iterate them
    for (let filename of files_name)
    {
        // Store original filenames
        original_fn.push({"id": filename.dataset.pos, "name": filename.textContent})        

        // Set filenames to lower case
        filename.textContent = filename.textContent.toLowerCase()

        // Shrink the filename
        if (filename.textContent.length > 10)
        {
            filename.textContent = filename.textContent.slice(0, 9) + ".."
        }
    }
}


/** 
 * Wait n seconds before continuing
 * with the code execution.
 * @param {number} seconds - Number of seconds.
 */
function wait(seconds)
{
    return new Promise(res=>{
        setTimeout(() => {
            res()
        }, seconds * 1000);
    })
}


/** Wait 5 seconds for the elements to show up.
 * 
 *  @param {querySelectorAll} nodeList - HTML elements to wait for.
 *  @param {number} seconds - Seconds to wait for the elements (30s by default).
 *  @returns The elements.
*/
function waitForElements(nodeList, seconds=30)
{
    return new Promise((res, rej)=>{
        // Checking time condition to stop the waiting
        if (seconds == 0)
        {
            rej("Elements could not be found")
        }

        // Checking if the elements are ready
        else if (nodeList.length > 0)
        {
            res(nodeList)
        }

        // Re run the function each second
        else if (nodeList.length == 0)
        {
            setTimeout(()=>{
                waitForElements(nodeList, seconds - 1)
            }, 1000)
        }
    })
}




/** 
 * Wait for the File Picker to pops up.
 */
function wait_fp()
{
    return new Promise(res=>{
        // Once the File Picker shows up, the interval will be cleared
        let code = setInterval(() => {
            if (document.hasFocus() == false)
            {
                clearInterval(code)
                res()
            }
        }, 1000);
    })
}


/**
 * Wait for the File Picker to closed.
 */
function wait_file(parent, bttn_id)
{
    return new Promise((res)=>{
        // Wait for uploaded files
        async function upload(){
            // Get the files from input
            let files = parent.children[bttn_id].files

            // Check if the website is not focus
            if (document.hasFocus() == false)
            {
                if (files.length == 0)
                {
                    setTimeout(()=>{upload()}, 100)
                }
                else
                {
                    // This res() will never be reached because 
                    // of the hasFocus() which will be triggered first
                    // but I'll leave it here just in case.
                    res()
                }
            }
            // Website is focus again
            else
            {
                // Wait 2 secods
                await wait(1)
                res()
            }
        }
        upload()
    })
}


// Export the functions
export { createFile, renderPDF, shrinkText, wait, wait_fp, wait_file, waitForElements };