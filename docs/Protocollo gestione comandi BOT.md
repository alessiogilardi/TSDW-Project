# Protocollo di gestione comandi Bot Telegram

## Inziamo dal definire la catena di comando per la generazione di una missione

1. L'AM dell'__Operatore__ richiede una _missione_ al __Responsabile di Base__;
2. Il __Responsabile__ riceve l'incarico e stablisce un __rango__ per la missione e il tipo di __drone__ da usare;
3. Mediante __Bot Telegram__ richiama una __funzione__ che lo autorizza verificando che egli sia in effeti un supervisore in quella base
4. Una volta __autorizzato__ gli viene restituita una lista di __Droni__ idonei (ordinati per ultima manutenzione???);

5. Il supervisor sceglie dalla lista;
6. Richiama una funzione che crea la missione;








### Idea 1:
Tenere una "cache" che tenga gli idTelegram, il ruolo dell'utente e la data di inserimento nella query
La query viene invalidata allo scattare di certe condizioni...

### Idea 2:
Tenere una lista di operazioni che ogni ruolo può compiere


