/*****************************************************************************
Copyright (c) 2007-2020 - Maxprograms,  http://www.maxprograms.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to compile, 
modify and use the Software in its executable form without restrictions.

Redistribution of this Software or parts of it in any form (source code or 
executable binaries) requires prior written permission from Maxprograms.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.
*****************************************************************************/

class VerticalSplit {

    left: HTMLDivElement;
    divider: HTMLDivElement;
    right: HTMLDivElement;

    currentSum: number;

    constructor(parent: HTMLDivElement, leftPercentage: number) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'row';

        this.left = document.createElement('div');
        this.left.style.width = leftPercentage + '%';
        parent.appendChild(this.left);

        this.divider = document.createElement('div');
        this.divider.classList.add('hdivider');
        this.divider.draggable = true;
        this.divider.addEventListener('dragstart', (event: DragEvent) => {
            this.dragStart(event);
        });
        this.divider.addEventListener('dragend', (event) => {
            this.dragEnd(event);
        });
        parent.appendChild(this.divider);

        this.right = document.createElement('div');
        this.right.style.width = (100 - leftPercentage) + '%';
        parent.appendChild(this.right);
    }

    leftPanel(): HTMLDivElement {
        return this.left;
    }

    rightPanel(): HTMLDivElement {
        return this.right;
    }

    dragStart(ev: DragEvent) {
        this.currentSum = this.left.clientWidth + this.right.clientWidth;
    }

    dragEnd(ev: DragEvent) {
        var leftWidth: number = this.left.clientWidth + ev.offsetX;
        if (leftWidth < 5) {
            leftWidth = 5;
        }
        var rightWidth: number = this.currentSum - leftWidth;
        this.left.style.width = leftWidth + 'px';
        this.right.style.width = rightWidth + 'px';
    }
}

class ThreeVerticalPanels {

    left: HTMLDivElement;
    leftDivider: HTMLDivElement;
    center: HTMLDivElement;
    rightDivider: HTMLDivElement;
    right: HTMLDivElement;

    leftWidth: number;
    centerWidth: number;
    rightWidth: number;

    constructor(parent: HTMLDivElement) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'row';

        this.left = document.createElement('div');
        this.left.style.width = '33%';
        parent.appendChild(this.left);

        this.leftDivider = document.createElement('div');
        this.leftDivider.classList.add('hdivider');
        this.leftDivider.draggable = true;
        this.leftDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.leftDivider.addEventListener('dragend', (event) => {
            this.leftDragEnd(event);
        });
        parent.appendChild(this.leftDivider);

        this.center = document.createElement('div');
        this.center.style.width = '33%';
        parent.appendChild(this.center);

        this.rightDivider = document.createElement('div');
        this.rightDivider.classList.add('hdivider');
        this.rightDivider.draggable = true;
        this.rightDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.rightDivider.addEventListener('dragend', (event) => {
            this.rightDragEnd(event);
        });
        parent.appendChild(this.rightDivider);

        this.right = document.createElement('div');
        this.right.style.width = '33%';
        parent.appendChild(this.right);
    }

    setWeights(weights: number[]): void {
        this.left.style.width = weights[0] + '%';
        this.center.style.width = weights[1] + '%';
        this.right.style.width = weights[2] + '%';
    }

    leftPanel(): HTMLDivElement {
        return this.left;
    }

    centerPanel(): HTMLDivElement {
        return this.center;
    }

    rightPanel(): HTMLDivElement {
        return this.right;
    }

    dragStart() {
        this.leftWidth = this.left.clientWidth;
        this.centerWidth = this.center.clientWidth;
        this.rightWidth = this.right.clientWidth;
    }

    leftDragEnd(ev: DragEvent) {
        let sum = this.leftWidth + this.centerWidth + this.rightWidth;
        this.leftWidth = this.leftWidth + ev.offsetX;
        if (this.leftWidth < 5) {
            this.leftWidth = 5;
        }
        this.centerWidth = sum - this.leftWidth - this.rightWidth;
        this.left.style.width = this.leftWidth + 'px';
        this.center.style.width = this.centerWidth + 'px';
    }

    rightDragEnd(ev: DragEvent) {
        let sum = this.leftWidth + this.centerWidth + this.rightWidth;
        this.centerWidth = this.centerWidth + ev.offsetX;
        if (this.centerWidth < 5) {
            this.centerWidth = 5;
        }
        this.rightWidth = sum - this.leftWidth - this.centerWidth;
        this.center.style.width = this.centerWidth + 'px';
        this.right.style.width = this.rightWidth + 'px';
    }
}

class HorizontalSplit {

    currentSum: number;

    top: HTMLDivElement;
    divider: HTMLDivElement;
    bottom: HTMLDivElement;

    constructor(parent: HTMLDivElement, topPercentage: number) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'column';

        this.top = document.createElement('div');
        this.top.style.height = topPercentage + '%';
        parent.appendChild(this.top);

        this.divider = document.createElement('div');
        this.divider.classList.add('vdivider');
        this.divider.draggable = true;
        this.divider.addEventListener('dragstart', (event: DragEvent) => {
            this.dragStart(event);
        });
        this.divider.addEventListener('dragend', (event: DragEvent) => {
            this.dragEnd(event);
        });
        parent.appendChild(this.divider);

        this.bottom = document.createElement('div');
        this.bottom.style.height = (100 - topPercentage) + '%';
        parent.appendChild(this.bottom);
    }

    topPanel(): HTMLDivElement {
        return this.top;
    }

    bottomPanel(): HTMLDivElement {
        return this.bottom;
    }

    dragStart(ev: DragEvent) {
        this.currentSum = this.top.clientHeight + this.bottom.clientHeight;
    }

    dragEnd(ev: DragEvent) {
        var topHeight: number = this.top.clientHeight + ev.offsetY;
        if (topHeight < 5) {
            topHeight = 5;
        }
        var bottomHeight: number = this.currentSum - topHeight;
        this.top.style.height = topHeight + 'px';
        this.bottom.style.height = bottomHeight + 'px';
    }
}

class ThreeHorizontalPanels {

    top: HTMLDivElement;
    topDivider: HTMLDivElement;
    center: HTMLDivElement;
    bottomDivider: HTMLDivElement;
    bottom: HTMLDivElement;

    topHeight: number;
    centerHeight: number;
    bottomHeight: number;

    constructor(parent: HTMLDivElement) {
        parent.style.display = 'flex';
        parent.style.flexDirection = 'column';

        this.top = document.createElement('div');
        this.top.style.height = '33%';
        parent.appendChild(this.top);

        this.topDivider = document.createElement('div');
        this.topDivider.classList.add('vdivider');
        this.topDivider.draggable = true;
        this.topDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.topDivider.addEventListener('dragend', (event: DragEvent) => {
            this.topDragEnd(event);
        });
        parent.appendChild(this.topDivider);

        this.center = document.createElement('div');
        this.center.style.height = '33%';
        parent.appendChild(this.center);

        this.bottomDivider = document.createElement('div');
        this.bottomDivider.classList.add('vdivider');
        this.bottomDivider.draggable = true;
        this.bottomDivider.addEventListener('dragstart', () => {
            this.dragStart();
        });
        this.bottomDivider.addEventListener('dragend', (event: DragEvent) => {
            this.bottomDragEnd(event);
        });
        parent.appendChild(this.bottomDivider);

        this.bottom = document.createElement('div');
        this.bottom.style.height = '33%';
        parent.appendChild(this.bottom);
    }

    setWeights(weights: number[]): void {
        this.top.style.height = weights[0] + '%';
        this.center.style.height = weights[1] + '%';
        this.bottom.style.height = weights[2] + '%';
    }

    topPanel(): HTMLDivElement {
        return this.top;
    }

    centerPanel(): HTMLDivElement {
        return this.center;
    }

    bottomPanel(): HTMLDivElement {
        return this.bottom;
    }

    dragStart() {
        this.topHeight = this.top.clientHeight;
        this.centerHeight = this.center.clientHeight;
        this.bottomHeight = this.bottom.clientHeight;
    }

    topDragEnd(event: DragEvent) {
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.topHeight = this.topHeight + event.offsetY;
        if (this.topHeight < 5) {
            this.topHeight = 5;
        }
        this.centerHeight = sum - this.topHeight - this.bottomHeight;
        this.top.style.height = this.topHeight + 'px';
        this.center.style.height = this.centerHeight + 'px';
    }


    bottomDragEnd(event: DragEvent) {
        let sum = this.topHeight + this.centerHeight + this.bottomHeight;
        this.centerHeight = this.centerHeight + event.offsetY;
        if (this.centerHeight < 5) {
            this.centerHeight = 5;
        }
        this.bottomHeight = sum - this.topHeight - this.centerHeight;
        this.center.style.height = this.centerHeight + 'px';
        this.bottom.style.height = this.bottomHeight + 'px';
    }
}