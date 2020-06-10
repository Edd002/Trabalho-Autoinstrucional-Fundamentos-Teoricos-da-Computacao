/* ============ NATIVO DA BIBLIOTECA PARA GERAÇÃO DE AUTÔMATOS =========== */

var regParser = require('regparser');
var parser = new regParser.RegParser();

document.getElementById("compile-dot").addEventListener("click", function (e) {
	var input = document.getElementById("repl_source").value;
	parser.reset(input);
	try { 
		var nfa = parser.parseToNFA();
		document.getElementById("repl_results").className="";
		document.getElementById("repl_results").innerHTML = nfa.toDotScript();

		// Automata string
		console.log(nfa.toDotScript());
	} catch(e) {
		document.getElementById("repl_results").className="error";
		document.getElementById("repl_results").innerHTML = e;
	}
});

document.getElementById("compile-nfa").addEventListener("click", function (e) {
	var input = document.getElementById("repl_source").value;
	parser.reset(input);
	try { 
		var nfa = parser.parseToNFA();
		var result = Viz(nfa.toDotScript(), 'svg', 'dot');
		document.getElementById("repl_results").className = "";
		document.getElementById("repl_results").innerHTML = result;

		// Automata string
		console.log(nfa.toDotScript());
	} catch(e) {
		document.getElementById("repl_results").className = "error";
		document.getElementById("repl_results").innerHTML = e;
	}
});

document.getElementById("compile-dfa").addEventListener("click", function (e) {
	var input = document.getElementById("repl_source").value;
	parser.reset(input);
	try {
		var nfa = parser.parseToDFA();
		var result = Viz(nfa.toDotScript(), 'svg', 'dot');
		document.getElementById("repl_results").className = "";
		document.getElementById("repl_results").innerHTML = result;

		// Automata string
		console.log(nfa.toDotScript());
	} catch(e) {
		document.getElementById("repl_results").className = "error";
		document.getElementById("repl_results").innerHTML = e;
	}
});

/* ======================================================================= */



/* ==================== FUNÇÕES DAS REGRAS DE NEGÓCIO ==================== */

// ------------------------ Arquivo AFN para AFD -------------------------
// Executado quando a página é carregada
function onLoad() {
	document.getElementById("buttonGenerateAutomata").disabled = true;
	document.getElementById("buttonDownloadAutomataFile").disabled = true;
}

// Recuperar conteúdo de arquivo de texto
document.getElementById('textFileInput').addEventListener('change', readSingleFile, false);
function readSingleFile(evt) {
	//Recuperar apenas o primerio arquivo do objeto FileList
	var file = evt.target.files[0]; 

	if (!file) {
		document.getElementById('textFileArea').innerHTML = "Erro ao carregar arquivo.";
		document.getElementById("buttonGenerateAutomata").disabled = true;
	} else if (!file.type.match('text.*')) {
		document.getElementById('labelFileInput').innerHTML = file.name;
		document.getElementById('textFileArea').innerHTML = file.name + " não é um arquivo válido.";
		document.getElementById("buttonGenerateAutomata").disabled = true;
    } else { 
		var r = new FileReader();
		r.onload = function(e) {
			var contents = e.target.result;
			document.getElementById("buttonGenerateAutomata").disabled = false;
			document.getElementById('labelFileInput').innerHTML = file.name;
			document.getElementById('textFileInputArea').innerHTML = contents;
			document.getElementById('textFileOutputArea').innerHTML = "";
			document.getElementById("buttonDownloadAutomataFile").disabled = true;

			// Dados do arquivo
			//console.log("Arquivo carregado.\nNome: " + file.name + "\nTipo: " + file.type + "\nTamanho: " + file.size + " bytes\nConteúdo: \n" + contents + "\n");
		}
		r.readAsText(file);
	}
}

// Gerar autômato (função chamada na página)
function generateAutomata() {
	var stringFile = document.getElementById('textFileInputArea').value;
	var stringAutomata = generateAutomataString(stringFile);
	//console.log("STRING AUTÔMATO")
	//console.log(stringAutomata);

	// Aqui é onde o autômato é construído a partir da string do AFD montada
	try {
		var result = Viz(stringAutomata, 'svg', 'dot');
		document.getElementById("repl_results").className = "";
		document.getElementById("repl_results").innerHTML = result;
		
		//console.log("STRING MONTADA: \n" + stringAutomata);
	} catch(e) {
		document.getElementById("repl_results").className = "error";
		document.getElementById("repl_results").innerHTML = e;
	}
}

// Montar string geradora do autômato a partir do arquivo de AFN
function generateAutomataString(stringFile) {
	//console.log("STRING FILE");
	//console.log(stringFile);

	// Jogar todo arquivo em um array
	console.log("ARRAY FILE");
	var arrayFile = stringFile.split("\n");
	console.log(arrayFile);

	var arrayAlfabet = arrayFile[0].split(" ");
	arrayAlfabet.shift();

	var arrayInitialStateNFA = arrayFile[1].split(" ");
	arrayInitialStateNFA.shift();

	var arrayFinalStateNFA = arrayFile[2].split(" ");
	arrayFinalStateNFA.shift();

	var arrayTransitionsNFA = new Array();
	for (var i = 0; i < (arrayFile.length - 3); i++)
		arrayTransitionsNFA[i] = arrayFile[i + 3].split(" ");

	for (var i = 0; i < arrayTransitionsNFA.length; i++)
		if (arrayTransitionsNFA[i].length <= 2)
			arrayTransitionsNFA[i].push("∅");

	var stringAutomata = buildAutomata(arrayAlfabet, arrayInitialStateNFA, arrayFinalStateNFA, arrayTransitionsNFA);
	return stringAutomata;
}

// Montar o arquivo de saída e a string do AFD (montar o desenho)
function buildAutomata(arrayAlfabet, arrayInitialStateNFA, arrayFinalStateNFA, arrayTransitionsNFA) {
	var stringExitFile = "";

	console.log("Alfabeto: ");
	console.log(arrayAlfabet);
	console.log("Estados iniciais (AFN): ");
	console.log(arrayInitialStateNFA);
	console.log("Estados finais (AFN): ");
	console.log(arrayFinalStateNFA);
	console.log("Transições (AFN): ");
	console.log(arrayTransitionsNFA);

	stringExitFile = "AB: ";
	stringExitFile += arrayAlfabet.join(" ") + "\n";

	stringExitFile += "i: {";
	stringExitFile += arrayInitialStateNFA.join(",") + "}\n";

	// ARRAY TABELA AFN (NFA)
	var arrayNFATable = buildNFATable(arrayAlfabet, arrayTransitionsNFA);

	// ARRAY TABELA AFD (NFD)
	var arrayNFDTable = buildNFDTable(arrayNFATable, arrayAlfabet, arrayInitialStateNFA);

	// Achar os estados finais no AFD
	var arrayFinalStateNFD = findNFDFinalStates(arrayFinalStateNFA, arrayNFDTable);

	stringExitFile += "f: {";
	stringExitFile += arrayFinalStateNFD.join("}{") + "}\n";

	for (var rowNFD = 1; rowNFD < arrayNFDTable.length; rowNFD++) {
		for (var columnNFD = 1; columnNFD < arrayNFDTable[0].length; columnNFD++) {
			stringExitFile += "{" + arrayNFDTable[rowNFD][0] + "} " + arrayNFDTable[0][columnNFD] + " {" + arrayNFDTable[rowNFD][columnNFD] + "}\n";
		}
	}

	console.log("Array Tabela AFN: ");
	console.log(arrayNFATable);
	console.log("Array Tabela AFD: ");
	console.log(arrayNFDTable);
	console.log("Estados finais (AFD): ");
	console.log(arrayFinalStateNFD);
	console.log("EXIT STRING\n" + stringExitFile);

	// Retornar o arquivo do AFD para a página
	document.getElementById('textFileOutputArea').innerHTML = stringExitFile;
	document.getElementById("buttonDownloadAutomataFile").disabled = false;

	// Retornar a string do AFD montado para construir o autômato na página
	return buildAutomataString(arrayNFDTable, arrayFinalStateNFD);
}

// Baixar arquivo de saída do AFD
function downloadAutomata() {
	var exitString = document.getElementById('textFileOutputArea').value;
	var fileName = "ArquivoSaidaAFD";
	var type = "text/plain;charset=utf-8";

	exitString = exitString.replace(/\n/g, "\r\n");
	var file = new Blob([exitString], {type: type});
	if (window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveOrOpenBlob(file, fileName);
	} else {
		var a = document.createElement("a"),
		url = URL.createObjectURL(file);
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		setTimeout(function() {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);  
		}, 0); 
	}
}
/* ----------------------------------------------------------------------- */


// ----------------------------- Tabela de AFD ------------------------------
function buildNFDTable(arrayNFATable, arrayAlfabet, arrayInitialStateNFA) {
	var arrayNFDTable = new Array(new Array());
	arrayNFDTable[0][0] = "δ";

	// Alfabeto
	for (var i = 0; i < arrayAlfabet.length; i++)
		arrayNFDTable[0][i + 1] = arrayAlfabet[i];

	// Estado inicial
	arrayNFDTable.push(new Array(arrayInitialStateNFA.join()));

	// Montagem da tabela de AFD
	var auxArraySplitStates = arrayNFDTable[1][0].split(",");
	var rowNFD = 1;
	while (true) {
		for (var columnNFD = 1; columnNFD < arrayNFDTable[0].length; columnNFD++) {
			if (auxArraySplitStates == "e") {
				arrayNFDTable[rowNFD][columnNFD] = "e";
			} else {
				for (var i = 0; i < auxArraySplitStates.length; i++) {
					for (var rowNFA = 1; rowNFA < arrayNFATable.length; rowNFA++) {

						if (arrayNFATable[rowNFA][0] == auxArraySplitStates[i]) {

							if (arrayNFDTable[rowNFD][columnNFD] != undefined)
								arrayNFDTable[rowNFD][columnNFD] += "," +  arrayNFATable[rowNFA][columnNFD];
							else
								arrayNFDTable[rowNFD][columnNFD] = arrayNFATable[rowNFA][columnNFD];

							arrayNFDTable[rowNFD][columnNFD] = formatNFD(arrayNFDTable, rowNFD, columnNFD);
						}
					}
				}
			}
		}

		auxArraySplitStates = nextNFDState(arrayNFDTable);
		if (auxArraySplitStates != undefined && auxArraySplitStates != null) {
			arrayNFDTable.push(new Array(auxArraySplitStates));
			auxArraySplitStates = auxArraySplitStates.split(",");
			rowNFD++;
		} else {
			break;;
		}
	}

	return arrayNFDTable;
}

function nextNFDState(arrayNFDTable) {
	var newState;
	for (var rowNFD = 1; rowNFD < arrayNFDTable.length; rowNFD++) {
		for (var columnNFD = 1; columnNFD < arrayNFDTable[0].length; columnNFD++) {

			newState = true;
			for (var row = 1; row < arrayNFDTable.length; row++) {
				if (arrayNFDTable[rowNFD][columnNFD] == arrayNFDTable[row][0]) {
					newState = false;
					break;
				}
			}

			if (newState == true)
				return arrayNFDTable[rowNFD][columnNFD];
		}
	}

	return null;
}

function formatNFD(arrayNFDTable, rowNFD, columnNFD) {
	arrayNFDTable[rowNFD][columnNFD] = arrayNFDTable[rowNFD][columnNFD].replace(",∅", "");
	arrayNFDTable[rowNFD][columnNFD] = arrayNFDTable[rowNFD][columnNFD].replace("∅,", "");
	arrayNFDTable[rowNFD][columnNFD] = arrayNFDTable[rowNFD][columnNFD].replace("e,", "");
	arrayNFDTable[rowNFD][columnNFD] = arrayNFDTable[rowNFD][columnNFD].replace(",e", "");
	arrayNFDTable[rowNFD][columnNFD] = arrayNFDTable[rowNFD][columnNFD].replace("∅", "e");

	var auxArrayRemoveDuplicates = arrayNFDTable[rowNFD][columnNFD].split(",");
	arrayNFDTable[rowNFD][columnNFD] = removeDuplicates(auxArrayRemoveDuplicates).join(",");

	return arrayNFDTable[rowNFD][columnNFD];
}

function findNFDFinalStates(arrayFinalStateNFA, arrayNFDTable) {
	var arrayFinalStateNFD = new Array();
	for (var i = 0; i < arrayFinalStateNFA.length; i++) {
		for (var rowNFD = 1; rowNFD < arrayNFDTable.length; rowNFD++) {
			var auxSplitState = arrayNFDTable[rowNFD][0].split(",");
			for (var j = 0; j < auxSplitState.length; j++) {
				if (arrayFinalStateNFA[i] == auxSplitState[j]) {
					arrayFinalStateNFD.push(arrayNFDTable[rowNFD][0]);
					break;
				}
			}
		}
	}
	arrayFinalStateNFD = removeDuplicates(arrayFinalStateNFD);

	return arrayFinalStateNFD;
}
/* ----------------------------------------------------------------------- */


// ----------------------------- Tabela de AFN ------------------------------
function buildNFATable(arrayAlfabet, arrayTransitions) {
	var arrayNFATable = new Array(new Array());
	arrayNFATable[0][0] = "δ";

	// Alfabeto
	for (var i = 0; i < arrayAlfabet.length; i++)
		arrayNFATable[0][i + 1] = arrayAlfabet[i];

	// Estados
	var arrayStates = new Array();
	for (var i = 0; i < arrayTransitions.length; i++)
		arrayStates.push(arrayTransitions[i][0]);

	arrayStates = removeDuplicates(arrayStates);
	for (var i = 0; i < arrayStates.length; i++)
		arrayNFATable.push(new Array(arrayStates[i]));

	// Montagem da tabela de AFN
	for (columnNFA = 1; columnNFA < arrayNFATable[0].length; columnNFA++) {
		for (rowNFA = 1; rowNFA < arrayNFATable.length; rowNFA++) {
			for (var rowTransitions = 0; rowTransitions < arrayTransitions.length; rowTransitions++) {
				if (arrayNFATable[0][columnNFA] == arrayTransitions[rowTransitions][1])
					if (arrayNFATable[rowNFA][0] == arrayTransitions[rowTransitions][0]) 
						arrayNFATable[rowNFA][columnNFA] = arrayTransitions[rowTransitions][2];
			}
		}
	}

	return arrayNFATable;
}
/* ----------------------------------------------------------------------- */


// ------------------------- String do Autômato ---------------------------
function buildAutomataString(arrayNFDTable, arrayFinalStateNFD) {
	var stringFinalStates = "";
	for (var i = 0; i < arrayFinalStateNFD.length; i++)
	stringFinalStates += 'node [shape = doublecircle]; "' + arrayFinalStateNFD[i] + '";';

	var stringInitialStateNFD = "";
	stringInitialStateNFD += '"" -> "' + arrayNFDTable[1][0] + '" [label = "Início"];';

	var statesTransitions = "";
	for (var columnNFD = 1; columnNFD < arrayNFDTable[0].length; columnNFD++) {
		for (var rowNFD = 1; rowNFD < arrayNFDTable.length; rowNFD++) {
			statesTransitions += '"' + arrayNFDTable[rowNFD][0] + '"->"' + arrayNFDTable[rowNFD][columnNFD] + '" [label="' + arrayNFDTable[0][columnNFD] + '"];'
		}
	}

	var stringAutomata = 
		'digraph finite_state_machine {'
		+ 'rankdir = LR;'
		+ stringFinalStates
		+ 'node [shape = circle]; "' + arrayNFDTable[1][0] + '";'
		+ 'node [shape = plaintext];'
		+ stringInitialStateNFD
		+ 'node [shape = circle];'
		+ statesTransitions
		+ '};';

	// Exemplo de string para geração de um autômato pela biblioteca
	/*
	var stringAutomata = 
		'digraph finite_state_machine {'
		+'rankdir = LR;'
		+'node [shape = doublecircle]; "0,0";'
		+'node [shape = doublecircle]; "1,1";'
		+'node [shape = doublecircle]; "2,2";'
		+'node [shape = plaintext];'
		+'"" -> "0,0" [label = "Início"];'
		+'node [shape = circle];'
		+'"0,0"->"1,1" [label="0"];'
		+'"0,0"->"2,2" [label="1"];'
		+'"1,1"->"1,1" [label="0"];'
		+'"1,1"->"2,2" [label="1"];'
		+'"2,2"->"1,1" [label="0"];'
		+'"2,2"->"2,2" [label="1"];'
		+'};';
	*/

	return stringAutomata;
}
/* ----------------------------------------------------------------------- */


/* --------------------------- FUNÇÕES AUXILIARES ------------------------ */
function removeDuplicates(arr) {
    let unique_array = [];
    for (let i = 0;i < arr.length; i++){
        if (unique_array.indexOf(arr[i]) == -1) {
            unique_array.push(arr[i])
        }
    }
    return unique_array
}
/* ----------------------------------------------------------------------- */

/* ======================================================================= */