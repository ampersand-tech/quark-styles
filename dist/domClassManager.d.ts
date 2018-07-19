/**
* Copyright 2015-present Ampersand Technologies, Inc.
*/
import * as React from 'react';
export declare type StashOf<T> = {
    [k: string]: T;
};
export declare type Stash = StashOf<any>;
declare type Style = StashOf<any>;
declare type StyleGeneratorWithString = (match: string, style: Style, errs: ErrorWithDetails[]) => void;
declare type StyleGeneratorWithRegEx = (match: RegExpMatchArray, style: Style, errs: ErrorWithDetails[]) => void;
export interface ErrorWithDetails {
    err: string;
    details: any;
}
interface ParsedClass {
    style: Style;
    className: string;
    errors: ErrorWithDetails[];
}
export declare function combineClasses(...args: (string | null | undefined)[]): string;
export declare function validateClassesString(classesString: string): string | null;
export declare function classesToStyle(classes: string): ParsedClass;
export declare function classesToSimpleStyle(classes: string): {
    style: Style;
    errs: string[];
};
export declare function applyGlobalClassStyles(styles: StashOf<string>, globalClassName: string, pseudoSelectors: string[]): StashOf<string>;
export declare function makeGlobalClass(globalClassName: string, classesString: string): void;
export declare function convertClasses(type: any, props: any): void;
export declare function resetCache(): void;
export declare class SemanticColorRoot<Props = {}> extends React.Component<Props, {}> {
    componentWillMount(): void;
    componentWillUnmount(): void;
    render(): React.ReactNode;
}
export declare function startModule(theModule: any): ClassModule;
declare class ClassModule {
    private reactRules;
    private reactClasses;
    addClass: ((className: string, classStyles: Style | StyleGeneratorWithString) => void) & ((classRegex: RegExp, classStyles: Style | StyleGeneratorWithRegEx) => void);
    dispose: () => void;
}
export declare function init(isTouchDevice: boolean, errFunc?: (err: string, details: any) => void): void;
export {};
