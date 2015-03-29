"use strict";
/*global phantom: false*/

var webpage = require("webpage");

if (phantom.args.length !== 3) {
    console.error("Usage: converter.js source dest scale");
    phantom.exit();
} else {
    convert(phantom.args[0], phantom.args[1], Number(phantom.args[2]));
}

function convert(source, dest, scale) {
    var page = webpage.create();
    var format = dest.substring(dest.length - 3);

    // Test if the source is actually a serialized svg
    // then just set the content for the page
    if (source.indexOf('<svg') === 0) {
        page.content = source;
        preprePage(page);

        // Make sure the page fits
        // https://github.com/ariya/phantomjs/issues/12685
        if (format === 'pdf') scalePage(page);

        // If we don't want transparency, make sure the background is white
        if (format !== 'png') setBackground(page);

        renderToFile(page, dest, scale);

    } else {

        page.open(source, function (status) {
            if (status !== "success") {
                console.error("Unable to load the source file.");
                phantom.exit();
                return;
            }

            renderToFile(page, dest, scale);
        });

    }
}

function renderToFile(page, dest, scale) {
    try {
        var dimensions = getSvgDimensions(page);
        page.viewportSize = {
            width: Math.round(dimensions.width * scale),
            height: Math.round(dimensions.height * scale)
        };
        if (dimensions.shouldScale) {
            page.zoomFactor = scale;
        }
    } catch (e) {
        console.error("Unable to calculate dimensions.");
        console.error(e);
        phantom.exit();
        return;
    }

    // This delay is I guess necessary for the resizing to happen?
    setTimeout(function () {
        page.render(dest);
        phantom.exit();
    }, 0);
}


function preprePage (page) {
    return page.evaluate(function () {
        /*global document: false*/

        // Make sure there is no padding or margin around
        var html = document.getElementsByTagName('html');
        var body = document.getElementsByTagName('body');

        if (html) {
            html[0].style.padding = 0;
            html[0].style.margin = 0;
        }

        if (body) {
            body[0].style.padding = 0;
            body[0].style.margin = 0;
        }
    });
}


function setBackground (page) {
    return page.evaluate(function () {
        /*global document: false*/

        // Make sure there is no padding or margin around
        var body = document.getElementsByTagName('body');

        if (body) {
            body[0].style.backgroundColor = '#fff';
        }
    });
}


function scalePage (page) {
    return page.evaluate(function () {
        /*global document: false*/

        var body = document.getElementsByTagName('body');
        if (body) {
            body[0].style.transformOrigin = '0 0';
            body[0].style.webkitTransformOrigin = '0 0';
            body[0].style.transform = 'scale(0.5)';
            body[0].style.webkitTransform = 'scale(0.5)';
        }
    });
}

function getSvgDimensions(page) {
    return page.evaluate(function () {
        /*global document: false*/
        var el = document.getElementsByTagName('svg')[0];
        var bbox = el.getBBox();

        var width = parseFloat(el.getAttribute("width"));
        var height = parseFloat(el.getAttribute("height"));
        var hasWidthOrHeight = width || height;
        var viewBoxWidth = el.viewBox.animVal.width;
        var viewBoxHeight = el.viewBox.animVal.height;
        var usesViewBox = viewBoxWidth && viewBoxHeight;

        if (usesViewBox) {
            if (width && !height) {
                height = width * viewBoxHeight / viewBoxWidth;
            }
            if (height && !width) {
                width = height * viewBoxWidth / viewBoxHeight;
            }
            if (!width && !height) {
                width = viewBoxWidth;
                height = viewBoxHeight;
            }
        }

        if (!width) {
            width = bbox.width + bbox.x;
        }
        if (!height) {
            height = bbox.height + bbox.y;
        }

        return { width: width, height: height, shouldScale: hasWidthOrHeight || !usesViewBox };
    });
}
