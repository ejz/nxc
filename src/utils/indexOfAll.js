export default function indexOfAll(arr, val) {
    let l = val.length;
    let indexes = [], i = -l;
    while ((i = arr.indexOf(val, i + l)) !== -1) {
        indexes.push(i);
    }
    return indexes;
}
