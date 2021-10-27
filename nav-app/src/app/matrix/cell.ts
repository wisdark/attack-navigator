import { Input, Directive } from '@angular/core';
import { Technique, Tactic, DataService } from '../data.service';
import { ViewModel } from '../viewmodels.service';
import { getCookie, hasCookie } from "../cookies";

declare var tinycolor: any; //use tinycolor2

@Directive()
export abstract class Cell {
    @Input() viewModel: ViewModel;
    @Input() technique: Technique;
    @Input() tactic: Tactic;

    public showContextmenu: boolean = false;
    isDarkTheme: boolean;

    constructor(public dataService: DataService) {
        this.dataService = dataService;
        if (hasCookie("is_user_theme_dark")) this.isDarkTheme = getCookie("is_user_theme_dark") === "true";
        else this.isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    public get isHighlighted(): boolean {
        let isHighlighted = this.showContextmenu;
        let idToMatch = this.technique.id;
        if (this.viewModel.selectSubtechniquesWithParent && this.technique.isSubtechnique) idToMatch = this.technique.parent.id;

        if (this.viewModel.highlightedTechniques.has(idToMatch)) {
            if (!this.viewModel.highlightedTactic) { // highlight is called from search component
                return true;
            } else {
                const isTacticMatching = this.viewModel.highlightedTactic.id === this.tactic.id;
                return (this.viewModel.selectTechniquesAcrossTactics || isTacticMatching);
            }
        }

        return isHighlighted;
    }

    /**
     * Return css classes for a technique
     * @param  {technique} technique the technique to get the class of
     * @param  {boolean}   mini is it the minitable?
     * @return {string}               the classes the technique should currently have
     */
    public getClass(): string {
        let theclass = 'link noselect cell'
        if (this.tactic && this.viewModel.isTechniqueSelected(this.technique, this.tactic))
            theclass += " editing"
        if (this.isHighlighted) { //open context menu always keeps highlight even if the mouse has moved elsewhere
            theclass += " highlight";
        }

        // classes added by layout config
        if (this.viewModel.layout.showID)
            theclass += " showID"
        if (this.viewModel.layout.showName)
            theclass += " showName"
        theclass += " " + this.viewModel.layout.layout;

        // classes according to annotations
        if (this.tactic && this.viewModel.getTechniqueVM(this.technique, this.tactic).comment.length > 0 || this.hasNotes())
            theclass += " commented"
        if (this.getTechniqueBackground())
            theclass += " colored"
        if (this.tactic && !this.viewModel.getTechniqueVM(this.technique, this.tactic).enabled)
            theclass += " disabled"

        return theclass
    }

    /**
     * Get most readable text color for the given technique
     * @param  technique     the technique to get the text color for
     * @param  antihighlight boolean, true if the column is not selected.
     * @return               black, white, or gray, depending on technique and column state
     */
    public getTechniqueTextColor() {
        if (!this.tactic) return this.isDarkTheme ? "white" : "black";
        let tvm = this.viewModel.getTechniqueVM(this.technique, this.tactic)
        if (!tvm.enabled) return "rgb(255 255 255 / 25%)";
        // don't display if disabled or highlighted
        // if (this.viewModel.highlightedTechnique && this.viewModel.highlightedTechnique.technique_tactic_union_id == this.technique.technique_tactic_union_id) return "black"
        if (tvm.color) return tinycolor.mostReadable(tvm.color, ["white", "black"]);
        if (this.viewModel.layout.showAggregateScores && tvm.aggregateScoreColor) return tinycolor.mostReadable(tvm.aggregateScoreColor, ["white", "black"]);
        if (tvm.score && !isNaN(Number(tvm.score))) return tinycolor.mostReadable(tvm.scoreColor, ["white", "black"]);
        else return this.isDarkTheme ? "white" : "black";
    }

    /**
     * Check if technique has notes
     * @return      true if technique has notes, false otherwise
     */
    public hasNotes() {
        let domain = this.dataService.getDomain(this.viewModel.domainVersionID);
        let notes = domain.notes.filter(note => {
            return note.object_refs.includes(this.technique.id);
        });
        return notes.length > 0;
    }

    /**
     * get the technique background style for ngstyle
     * @param  technique technique
     * @return           background object
     */
    public getTechniqueBackground(): any {
        if (!this.tactic) return null;
        let tvm = this.viewModel.getTechniqueVM(this.technique, this.tactic)
        // don't display if disabled or highlighted
        if (!tvm.enabled || this.isHighlighted) return null;
        if (tvm.color) return { "background": tvm.color }
        if (this.viewModel.layout.showAggregateScores && !isNaN(Number(tvm.aggregateScore))) return { "background": tvm.aggregateScoreColor }
        if (tvm.score) return { "background": tvm.scoreColor }
        // return tvm.enabled && tvm.score && !tvm.color && !(this.viewModel.highlightedTechnique && this.viewModel.highlightedTechnique.technique_id == technique.technique_id)
    }
}
