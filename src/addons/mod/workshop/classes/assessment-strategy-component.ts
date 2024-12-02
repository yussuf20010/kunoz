// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component, Input } from '@angular/core';
import { AddonModWorkshopGetAssessmentFormFieldsParsedData } from '../services/workshop';
import { AddonModWorkshopSubmissionAssessmentWithFormData } from '../services/workshop-helper';
import { toBoolean } from '@/core/transforms/boolean';

/**
 * Base class for component to render an assessment strategy.
 */
@Component({
    template: '',
})
export class AddonModWorkshopAssessmentStrategyBaseComponent {

    @Input({ required: true }) workshopId!: number;
    @Input({ required: true }) assessment!: AddonModWorkshopSubmissionAssessmentWithFormData;
    @Input({ required: true, transform: toBoolean }) edit = false;
    @Input({ required: true }) selectedValues!: AddonModWorkshopGetAssessmentFormFieldsParsedData[];
    @Input({ required: true }) fieldErrors!: Record<string, string>;
    @Input({ required: true }) strategy!: string;
    @Input({ required: true }) moduleId!: number;
    @Input() courseId?: number;

}
