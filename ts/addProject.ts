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

class AddProject {

    electron = require('electron');
    addedFiles: Map<number, any>;

    charsetOptions: string;
    typesOption: string;

    constructor() {
        this.addedFiles = new Map<number, any>();
        this.electron.ipcRenderer.send('get-theme');
        this.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        this.electron.ipcRenderer.send('get-clients');
        this.electron.ipcRenderer.on('set-clients', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setClients(arg);
        });
        this.electron.ipcRenderer.send('get-subjects');
        this.electron.ipcRenderer.on('set-subjects', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setSubjects(arg);
        });
        this.electron.ipcRenderer.send('get-languages');
        this.electron.ipcRenderer.on('set-languages', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setLanguages(arg);
        });
        this.electron.ipcRenderer.on('add-source-files', (event: Electron.IpcRendererEvent, arg: any) => {
            this.addFiles(arg);
        });
        this.electron.ipcRenderer.on('get-height', () => {
            let body: HTMLBodyElement = document.getElementById('body') as HTMLBodyElement;
            this.electron.ipcRenderer.send('add-project-height', { width: body.clientWidth, height: body.clientHeight });
        });
        this.electron.ipcRenderer.send('get-types');
        this.electron.ipcRenderer.on('set-types', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setTypes(arg);
        }); this.electron.ipcRenderer.send('get-charsets');
        this.electron.ipcRenderer.on('set-charsets', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setCharsets(arg);
        });
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                window.close();
            }
        });
        document.getElementById('addFilesButton').addEventListener('click', () => {
            this.electron.ipcRenderer.send('select-source-files');
            document.getElementById('addFilesButton').blur();
        });
        document.getElementById('addFolderButton').addEventListener('click', () => {
            this.addFolder();
        });
        document.getElementById('deleteFilesButton').addEventListener('click', () => {
            this.deleteFiles();
        });
        document.getElementById('addProjectButton').addEventListener('click', () => {
            this.addProject();
        });
        let today: Date = new Date();
        let min: string = today.getFullYear() + '-' + this.pad((today.getMonth() + 1)) + '-' + this.pad(today.getDate());
        (document.getElementById('dueDate') as HTMLInputElement).setAttribute("min", min);
    }

    addProject(): void {
        let name: string = (document.getElementById('nameInput') as HTMLInputElement).value;
        if (name === '') {
            window.alert('Enter name');
            return;
        }
        let length = this.addedFiles.size;
        if (length === 0) {
            window.alert('Add files');
            return;
        }
        let subject: string = (document.getElementById('subjectInput') as HTMLInputElement).value;
        let client: string = (document.getElementById('clientInput') as HTMLInputElement).value;
        let srcLang = (document.getElementById('srcLangSelect') as HTMLSelectElement).value;
        if (srcLang === 'none') {
            window.alert('Select source language');
            return;
        }
        let tgtLang = (document.getElementById('tgtLangSelect') as HTMLSelectElement).value;
        if (tgtLang === 'none') {
            window.alert('Select target language');
            return;
        }
        let dueDate: string = (document.getElementById('dueDate') as HTMLInputElement).value;
        if (dueDate === '') {
            window.alert('Select due date');
            return;
        }

        let array: any[] = [];
        this.addedFiles.forEach((a) => { array.push(a) });

        let params: any = {
            description: name,
            files: array,
            subject: subject,
            client: client,
            srcLang: srcLang,
            tgtLang: tgtLang,
            dueDate: dueDate
        }
        this.electron.ipcRenderer.send('create-project', params);
    }

    setClients(arg: any): void {
        // TODO
    }

    setSubjects(arg: any): void {
        // TODO
    }

    setLanguages(arg: any): void {
        var array = arg.languages;
        var languageOptions = '<option value="none">Select Language</option>';
        for (let i = 0; i < array.length; i++) {
            var lang = array[i];
            languageOptions = languageOptions + '<option value="' + lang.code + '">' + lang.description + '</option>';
        }
        document.getElementById('srcLangSelect').innerHTML = languageOptions;
        (document.getElementById('srcLangSelect') as HTMLSelectElement).value = arg.srcLang;
        document.getElementById('tgtLangSelect').innerHTML = languageOptions;
        (document.getElementById('tgtLangSelect') as HTMLSelectElement).value = arg.tgtLang;
    }

    addFiles(arg: any): void {
        let files: any[] = arg.files;
        let length = files.length;
        let tableBody: HTMLElement = document.getElementById('tableBody');
        if (this.addedFiles.size === 0) {
            tableBody.innerHTML = '';
        }
        for (let i = 0; i < length; i++) {
            let file: any = files[i];
            console.log(JSON.stringify(file));
            let hash = this.hashCode(file.file);
            if (!this.addedFiles.has(hash)) {
                this.addedFiles.set(hash, file);
                let tr = document.createElement('tr');
                tr.id = '' + hash;
                let td = document.createElement('td');
                let check: HTMLInputElement = document.createElement('input') as HTMLInputElement;
                check.type = 'checkbox';
                check.classList.add('check');
                check.setAttribute('data', '' + hash);
                td.appendChild(check);
                tr.appendChild(td);

                td = document.createElement('td');
                td.className = 'noWrap';
                td.style.overflowX = 'hidden';
                td.innerText = file.file;
                tr.appendChild(td);

                td = document.createElement('td');
                let typeSelect: HTMLSelectElement = document.createElement('select');
                typeSelect.innerHTML = this.typesOption;
                if (file.type !== 'Unknown') {
                    typeSelect.value = file.type;
                } else {
                    typeSelect.value = 'none';
                }
                td.appendChild(typeSelect);
                tr.appendChild(td);

                td = document.createElement('td');
                let charsetSelect: HTMLSelectElement = document.createElement('select');
                charsetSelect.innerHTML = this.charsetOptions;
                if (file.encoding !== 'Unknown') {
                    charsetSelect.value = file.encoding;
                } else {
                    charsetSelect.value = 'none';
                }
                td.appendChild(charsetSelect);
                tr.appendChild(td);

                tableBody.appendChild(tr);
            }
        }
    }

    addFolder(): void {
        // TODO
    }

    deleteFiles(): void {
        let tableBody: HTMLElement = document.getElementById('tableBody');
        let checked: HTMLCollectionOf<Element> = document.getElementsByClassName('check');
        let length = checked.length;
        for (let i = 0; i < length; i++) {
            let check = (checked.item(i) as HTMLInputElement);
            if (check.checked) {
                let data: string = check.getAttribute('data');
                this.addedFiles.delete(Number.parseInt(data));
                tableBody.removeChild(document.getElementById(data));
            }
        }
    }

    hashCode(str: string): number {
        return str.split('').reduce((prevHash, currVal) =>
            (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
    }

    pad(value: number): string {
        if (value < 10) {
            return '0' + value;
        }
        return '' + value;
    }

    setTypes(arg: any): void {
        this.typesOption = '<option value="none" class="error">Select Type</option>';
        let length: number = arg.formats.length;
        for (let i = 0; i < length; i++) {
            this.typesOption = this.typesOption + '<option value="' + arg.formats[i].code + '">' + arg.formats[i].description + '</option>';
        }
    }

    setCharsets(arg: any): void {
        this.charsetOptions = '<option value="none" class="error">Select Charset</option>';
        let length: number = arg.charsets.length;
        for (let i = 0; i < length; i++) {
            this.charsetOptions = this.charsetOptions + '<option value="' + arg.charsets[i].code + '">' + arg.charsets[i].description + '</option>';
        }
    }
}

new AddProject();