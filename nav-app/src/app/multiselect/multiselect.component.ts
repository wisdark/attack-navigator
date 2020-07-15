import { Component, OnInit, Input } from '@angular/core';
import { ViewModel } from '../viewmodels.service';
import { DataService, BaseStix, Group, Technique, Mitigation, Software } from '../data.service';

@Component({
  selector: 'app-multiselect',
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.scss']
})
export class MultiselectComponent implements OnInit {
    @Input() viewModel: ViewModel;

    private openedPanel: string = "";
    
    private stixTypes: any[];

    constructor(private dataService: DataService) { 
        this.stixTypes = [{
            "label": "threat groups",
            "objects": this.dataService.groups.filter((group, i, arr) => arr.findIndex(t => t.id === group.id) === i)
                       .sort((a,b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        }, {
            "label": "software",
            "objects": this.dataService.software.sort((a,b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        }, {
            "label": "mitigations",
            "objects": this.dataService.mitigations.sort((a,b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        }]
    }

    ngOnInit() {}

    private getRelated(stixObject: BaseStix): Technique[] {
        // master list of all techniques and sub-techniques
        let allTechniques = this.dataService.techniques.concat(this.dataService.subtechniques);

        if (stixObject instanceof Group) {
            return allTechniques.filter((technique: Technique) => (stixObject as Group).relatedTechniques().includes(technique.id));
        } else if (stixObject instanceof Software) {
            return allTechniques.filter((technique: Technique) => (stixObject as Software).relatedTechniques().includes(technique.id));
        } else if (stixObject instanceof Mitigation) {
            return allTechniques.filter((technique: Technique) => (stixObject as Mitigation).relatedTechniques().includes(technique.id));
        }
    }

    private deselect(stixObject: BaseStix): void {
       for (let technique of this.getRelated(stixObject)) {
            this.viewModel.unselectTechniqueAcrossTactics(technique);
       }
    }

    private select(stixObject: BaseStix): void {
        for (let technique of this.getRelated(stixObject)) {
            this.viewModel.selectTechniqueAcrossTactics(technique);
        }
    }


}
