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

class Main {

    static electron = require('electron');

    static tabHolder: TabHolder;
    static translationViews: Map<string, TranslationView>;

    mainContainer: HTMLDivElement;
    static main: HTMLDivElement;

    projectsView: ProjectsView;
    memoriesView: MemoriesView;
    glossariesView: GlossariesView;

    constructor() {
        Main.translationViews = new Map<string, TranslationView>();
        this.mainContainer = document.getElementById('mainContainer') as HTMLDivElement;
        Main.tabHolder = new TabHolder(this.mainContainer, 'main');

        Main.main = document.getElementById('main') as HTMLDivElement;

        let projectsTab = new Tab('projects', 'Projects', false);
        this.projectsView = new ProjectsView(projectsTab.getContainer());
        projectsTab.getLabel().addEventListener('click', () => {
            this.projectsView.setSizes();
        });
        Main.tabHolder.addTab(projectsTab);

        let memoriesTab = new Tab('memories', 'Memories', false);
        this.memoriesView = new MemoriesView(memoriesTab.getContainer());
        memoriesTab.getLabel().addEventListener('click', () => {
            this.memoriesView.setSizes();
        });
        Main.tabHolder.addTab(memoriesTab);

        let glossariesTab = new Tab('glossaries', 'Glossaries', false);
        this.glossariesView = new GlossariesView(glossariesTab.getContainer());
        glossariesTab.getLabel().addEventListener('click', () => {
            this.glossariesView.setSizes();
        });
        Main.tabHolder.addTab(glossariesTab);

        Main.tabHolder.selectTab('projects');

        let observerOptions = {
            childList: true,
            attributes: false
        }
        let tabsObserver = new MutationObserver((mutationList) => {
            mutationList.forEach((mutation) => {
                switch (mutation.type) {
                    case 'childList':
                        Main.checkTabs();
                        break;
                    case 'attributes':
                        break;
                }
            });
        });
        tabsObserver.observe(Main.tabHolder.getTabsHolder(), observerOptions);

        Main.electron.ipcRenderer.send('get-theme');
        Main.electron.ipcRenderer.on('set-theme', (event: Electron.IpcRendererEvent, arg: any) => {
            (document.getElementById('theme') as HTMLLinkElement).href = arg;
        });
        Main.electron.ipcRenderer.on('request-theme', () => {
            Main.electron.ipcRenderer.send('get-theme');
        });
        window.addEventListener('resize', () => {
            this.resizePanels();
        });
        Main.electron.ipcRenderer.on('view-projects', () => {
            Main.tabHolder.selectTab('projects');
        });
        Main.electron.ipcRenderer.on('request-projects', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectsView.loadProjects(arg);
        });
        Main.electron.ipcRenderer.on('remove-projects', () => {
            this.projectsView.removeProjects();
        });
        Main.electron.ipcRenderer.on('export-translations', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectsView.exportTranslations();
        });
        Main.electron.ipcRenderer.on('export-project', (event: Electron.IpcRendererEvent, arg: any) => {
            this.projectsView.exportProject();
        });
        Main.electron.ipcRenderer.on('view-memories', () => {
            Main.tabHolder.selectTab('memories');
        });
        Main.electron.ipcRenderer.on('request-memories', () => {
            this.memoriesView.loadMemories();
        });
        Main.electron.ipcRenderer.on('view-glossaries', () => {
            Main.tabHolder.selectTab('glossaries');
        });
        Main.electron.ipcRenderer.on('close-tab', () => {
            this.closeTab();
        });
        Main.electron.ipcRenderer.on('start-waiting', () => {
            document.getElementById('body').classList.add("wait");
        });
        Main.electron.ipcRenderer.on('end-waiting', () => {
            document.getElementById('body').classList.remove("wait");
        });
        Main.electron.ipcRenderer.on('set-status', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setStatus(arg);
        });
        Main.electron.ipcRenderer.on('add-tab', (event: Electron.IpcRendererEvent, arg: any) => {
            this.addTab(arg);
        });
        Main.electron.ipcRenderer.on('translate-projects', () => {
            this.projectsView.openProjects();
        });
        Main.electron.ipcRenderer.on('remove-memory', () => {
            this.memoriesView.removeMemory();
        });
        Main.electron.ipcRenderer.on('import-tmx', () => {
            this.memoriesView.importTMX();
        });
        Main.electron.ipcRenderer.on('export-tmx', () => {
            this.memoriesView.exportTMX();
        });
        Main.electron.ipcRenderer.on('first-page', () => {
            this.firstPage();
        });
        Main.electron.ipcRenderer.on('previous-page', () => {
            this.previousPage();
        });
        Main.electron.ipcRenderer.on('next-page', () => {
            this.nextPage();
        });
        Main.electron.ipcRenderer.on('last-page', () => {
            this.lastPage();
        });
        Main.electron.ipcRenderer.on('cancel-edit', () => {
            this.cancelEdit();
        });
        Main.electron.ipcRenderer.on('save-edit', (event: Electron.IpcRendererEvent, arg: any) => {
            this.saveEdit(arg);
        });
        Main.electron.ipcRenderer.on('copy-source', () => {
            this.copySource();
        });
        Main.electron.ipcRenderer.on('insert tag', (event: Electron.IpcRendererEvent, arg: any) => {
            this.inserTag(arg);
        });
        Main.electron.ipcRenderer.on('auto-propagate', (event: Electron.IpcRendererEvent, arg: any) => {
            this.autoPropagate(arg);
        });
        Main.electron.ipcRenderer.on('set-matches', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setMatches(arg);
        });
        Main.electron.ipcRenderer.on('set-target', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setTarget(arg);
        });
        Main.electron.ipcRenderer.on('get-mt-matches', () => {
            this.getMachineTranslations();
        });
        Main.electron.ipcRenderer.on('get-tm-matches', () => {
            this.getTmMatches();
        });
        Main.electron.ipcRenderer.on('set-project-memories', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setProjectMemories(arg);
        });
        Main.electron.ipcRenderer.on('reload-page', (event: Electron.IpcRendererEvent, arg: any) => {
            this.reloadPage(arg);
        });
        Main.electron.ipcRenderer.on('set-statistics', (event: Electron.IpcRendererEvent, arg: any) => {
            this.setStatistics(arg);
        });
        Main.electron.ipcRenderer.on('find-text', () => {
            this.findText();
        });
        let config: any = { attributes: true, childList: false, subtree: false };
        let observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'attributes') {
                    Main.main.style.height = (this.mainContainer.clientHeight - 31) + 'px';
                    Main.main.style.width = this.mainContainer.clientWidth + 'px';
                }
            }
        });
        observer.observe(this.mainContainer, config);

        setTimeout(() => {
            this.resizePanels();
        }, 200);
    }

    setStatus(arg: any): void {
        var status: HTMLDivElement = document.getElementById('status') as HTMLDivElement;
        status.innerHTML = arg;
        if (arg.length > 0) {
            status.style.display = 'block';
        } else {
            status.style.display = 'none';
        }
    }

    addTab(arg: any): void {
        if (Main.tabHolder.has(arg.id)) {
            Main.tabHolder.selectTab(arg.id);
            return;
        }
        let tab = new Tab(arg.id, arg.description, true);
        let view: TranslationView = new TranslationView(tab.getContainer(), arg.id, arg.srcLang, arg.tgtLang);
        Main.tabHolder.addTab(tab);
        Main.tabHolder.selectTab(arg.id);
        tab.getLabel().addEventListener('click', () => {
            view.setSize();
            view.setSpellChecker();
        });
        Main.translationViews.set(arg.id, view);
    }

    closeTab(): void {
        let selected: string = Main.tabHolder.getSelected();
        if (Main.tabHolder.canClose(selected)) {
            Main.tabHolder.closeTab(selected);
        }
    }

    resizePanels(): void {
        let body = document.getElementById('body');
        this.mainContainer.style.width = body.clientWidth + 'px';
        this.mainContainer.style.height = body.clientHeight + 'px';
    }

    static checkTabs(): void {
        for (let key of Main.translationViews.keys()) {
            if (!Main.tabHolder.has(key)) {
                console.log('MUST CLOSE ' + key);
                let view: TranslationView = Main.translationViews.get(key);
                view.close();
                Main.translationViews.delete(key);
                Main.electron.ipcRenderer.send('close-project', { project: key });
                break;
            }
        }
    }

    cancelEdit(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).cancelEdit();
        }
    }

    saveEdit(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).saveEdit(arg);
        }
    }

    copySource(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).copySource();
        }
    }

    inserTag(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).inserTag(arg);
        }
    }

    autoPropagate(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).autoPropagate(arg.rows);
        }
    }

    setMatches(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).setMatches(arg.matches);
        }
    }

    setTarget(arg: any): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).setTarget(arg);
        }
    }

    firstPage(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).firstPage();
        }
    }

    previousPage(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).previousPage();
        }
    }

    nextPage(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).nextPage();
        }
    }

    lastPage(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).lastPage();
        }
    }

    getMachineTranslations(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).getMachineTranslations();
        }
    }

    getTmMatches(): void {
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).getTmMatches();
        }
    }

    setProjectMemories(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            Main.translationViews.get(project).setProjectMemories(arg);
        }
    }

    reloadPage(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            Main.translationViews.get(project).getSegments();
        }
    }

    setStatistics(arg: any): void {
        let project: string = arg.project;
        if (Main.translationViews.has(project)) {
            Main.translationViews.get(project).setStatistics(arg.statistics);
        }
    }

    findText(): void{
        let selected = Main.tabHolder.getSelected();
        if (Main.translationViews.has(selected)) {
            Main.translationViews.get(selected).findText();
        }
    }
}

new Main();
