/**
* Copyright 2018-present Ampersand Technologies, Inc.
*
* @allowConsoleFuncs
*/
interface SafeAreaInfo {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export declare let safeAreaSize: SafeAreaInfo;
export declare function initSafeArea(): void;
export declare function registerSafeAreaDependent(cb: () => void): void;
export {};
