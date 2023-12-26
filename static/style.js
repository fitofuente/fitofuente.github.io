'use strict'

import { shrinkText } from "./helper.js"

document.addEventListener("DOMContentLoaded", ()=>{
    getYear()
    shrinkText()
    if (window.location.pathname == "/")
    {
        getHeight()
    }
})

/** Display year correctly */
function getYear()
{
    const sys_year = new Date().getFullYear()
    document.querySelector("#year").textContent = sys_year
}

/** Get viewport height to properly set the height of the loading screen */
function getHeight()
{
    let viewport_h = document.body.offsetHeight

    // Capture the loading screen
    const loading_screen = document.querySelector("#load_sc")
    loading_screen.style.height = `calc(${viewport_h.toString()}px - (var(--header_size) + var(--footer_size))`
}