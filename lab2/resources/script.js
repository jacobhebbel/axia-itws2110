
function scrollBehavior(element, offset) {
    element.scrollIntoView({
        behavior: 'smooth'
    });

    setTimeout(() => {
        window.scrollBy({
            top: offset, 
            behavior: 'smooth'
        });
    }, 50);
}

const scrollUpButtons = document.querySelectorAll('.article-button button #up');
const scrollDownButtons = document.querySelectorAll('.article-button button #down');

// for each up button
// -> choose an offset (make sure it follows direction)
// -> add an event listener on click calling scrollBehavior

// for each down button
// -> choose an offset (make sure it follows direction)
// -> add an event listener on click calling scrollBehavior
