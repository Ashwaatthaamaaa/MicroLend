declare module "*.json" {
    const value: any;
    export default value;
}

interface Window {
    ethereum: import('ethers').Eip1193Provider & {
        once(eventName: string, listener: (...args: any[]) => void): void;
        on(eventName: string, listener: (...args: any[]) => void): void;
        removeListener(eventName: string, listener: (...args: any[]) => void): void;
        removeAllListeners(): void;
        request(args: { method: string; params?: any[] }): Promise<any>;
    };
}
