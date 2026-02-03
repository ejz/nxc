export default function asyncExecute(fn, ...args) {
    try {
        return Promise.resolve(fn(...args));
    } catch (e) {
        return Promise.reject(e);
    }
}
