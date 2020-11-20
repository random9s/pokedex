const STRING = 'string';
const OBJECT = 'object';
const FUNCTION = 'function';
const NUMBER = 'number';

const checkType = (assertedType, x, msg) => {
    if (!x) return;
    if (typeof x !== assertedType) throw 'Type Error: ' + msg;
};

const checkProps = props => {
    checkType (STRING, props.id || '', 'Attribute id must be of type string');
    checkType (STRING, props.innerHTML || '', 'Attribute innerHTML must be of type string');
    checkType (STRING, props.style || '', 'Attribute style must be of type string');
    checkType (STRING, props.src || '', 'Attribute src must be of type string');
    checkType (STRING, props.alt || '', 'Attribute alt must be of type string');

    checkType (OBJECT, props.classList || [], 'classList must be of type string array');
    if (props.classList)
        for (const idx in props.classList)
            checkType(STRING, props.classList[idx], 'class element must be of type string');

    checkType (OBJECT, props.children || [], 'children must be of type object');
    if (props.children)
        for (const idx in props.children)
            checkType(OBJECT, props.children[idx], 'children must be of type object');

    checkType (OBJECT, props.events || {}, 'events must be of type object');
    if (props.events)
        for (const name in props.events)
            checkType(FUNCTION, props.events[name], 'event must be of type function');

    checkType (OBJECT, props.attributes || {}, 'attributes must be of type object');
};

const EL = (tag, props = {}) => {
    try {
        checkProps (props);

        let e = document.createElement(tag);
        if (props.id) e.id = props.id;
        if (props.style) e.style = props.style;
        if (props.innerHTML) e.innerHTML = props.innerHTML;
		if (props.alt) e.alt = props.alt;
		if (props.src) e.src = props.src;
		if (props.width) e.width = props.width;
		if (props.height) e.height = props.height;

        for (const idx in props.classList) e.classList.add(props.classList[idx]);
        for (const idx in props.children) e.appendChild(props.children[idx]);
        for (const name in props.events) e.addEventListener(name, props.events[name]);
        for (const name in props.attributes) e.setAttribute(name, props.attributes[name]);

        props = null;
        return e;
    } catch (ex) {
        throw 'Failed to execute newElement: ' + ex;
    }
};

const span = (text, props = {}) => {
	props.innerHTML = String(text);
	return EL('span', props);
};
