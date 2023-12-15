module.exports = function (babel) {
  var t = babel.types;
  return {
    name: "custom-jsx-plugin",
    visitor: {
      JSXText(path) {
        // if the child of JSX Element is normal string
        var stringChild = t.stringLiteral(path.node.value);
        path.replaceWith(stringChild, path.node);
      },
      JSXElement(path) {
        var openingElement = path.node.openingElement;
        var tagName = openingElement.name.name;
        var args = [];
        //adds "div" or any tag as a string as one of the argument
        args.push(t.stringLiteral(tagName));

        var attribs = t.nullLiteral();
        attribs = openingElement.attributes;
        if (attribs.length) {
          var _props = [];
          while (attribs.length) {
            var prop = attribs.shift();
            if (t.isJSXSpreadAttribute(prop)) {
              prop.arguments._isSpread = true;
              _props.push(t.spreadElement(prop.argument));
            } else {
              _props.push(convertAttribute(prop, false));
            }
          }
          attribs = t.objectExpression(_props);
        } else {
          attribs = t.nullLiteral();
        }
        args.push(attribs);
        // order in AST Top to bottom -> (CallExpression => MemberExpression => Identifiers)
        // below are the steps to create a callExpression
        var reactIdentifier = t.identifier("encours"); //object
        var createElementIdentifier = t.identifier("createElement"); //property of object
        var callee = t.memberExpression(
          reactIdentifier,
          createElementIdentifier
        );
        var callExpression = t.callExpression(callee, args);
        //now add children as a third argument
        const childArray = [];
        const children = path.node.children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (child.type === "JSXElement") {
            childArray.push(child);
          }
          if (child.type === "JSXExpressionContainer") {
            const result = convertLogicalExpression(child);
            if (result) {
              childArray.push(result);
            }
          }
          if (child.type === "JSXText") {
            child.value = child.value.replace("\n", "").trim();
            if (!child.value.includes("\n") && child.value.length > 0) {
              childArray.push(child);
            }
          }
        }

        callExpression.arguments = callExpression.arguments.concat(childArray);
        path.replaceWith(callExpression, path.node);
      },
    },
  };

  function convertLogicalExpression(node) {
    const left = node.expression.left.left.value;
    const right = node.expression.left.right.value;
    const operator = node.expression.left.operator;
    switch (operator) {
      case "===":
        return left === right ? node.expression.right : null;
        break;
      case "==":
        return left == right ? node.expression.right : null;
        break;
      case "!=":
        return left != right ? node.expression.right : null;
        break;
      case "!==":
        return left !== right ? node.expression.right : null;
        break;
      case ">":
        return left > right ? node.expression.right : null;
        break;
      case ">=":
        return left >= right ? node.expression.right : null;
        break;
      case "<":
        return left < right ? node.expression.right : null;
        break;
      case "<=":
        return left <= right ? node.expression.right : null;
        break;
      default:
        return null;
    }
  }

  function convertAttribute(node, addArrow) {
    var value = convertAttributeValue(node.value || t.booleanLiteral(true));
    if (t.isStringLiteral(value) && !t.isJSXExpressionContainer(node.value)) {
      value.value = value.value.replace(/\n\s+/g, " ");
    }
    if (t.isValidIdentifier(node.name.name)) {
      node.name.type = "Identifier";
    } else {
      node.name = t.stringLiteral(node.name.name);
    }

    // extra option to add arrow around every attribute value that is js expression
    if (addArrow && t.isJSXExpressionContainer(node.value)) {
      value = t.arrowFunctionExpression([], value);
    }
    return t.inherits(t.objectProperty(node.name, value), node);
  }

  function convertAttributeValue(node) {
    if (t.isJSXExpressionContainer(node)) {
      return node.expression;
    } else {
      return node;
    }
  }
};
