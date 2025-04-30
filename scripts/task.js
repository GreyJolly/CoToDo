function openPriorityPopup() {
    const popup = document.getElementById("priorityPopup");
    popup.classList.toggle("visible");
}

function closePriorityPopup() {
    const popup = document.getElementById("priorityPopup");
    popup.classList.remove("visible");
    popup.hidden = true;
}

function openSublist() {
    const hint = document.getElementById("enterHintContainer");
    hint.classList.toggle("visible");
    closePriorityPopup();
}

function openAssignMembers() {
    const assign = document.getElementById("assignMembersPopup");
    assign.classList.toggle("visible");
    closePriorityPopup();
}
