% [2021-01-04 06:09:07]
{ok, Server} = couchdb:server_record(<<"http://localhost:5984">>, []).
{ok, Info} = couchdb_server:info(Server).

{ok,DB} = couchdb:database_record(Server, <<"config">>).
{ok,Docs} = couchdb_databases:all_docs(Db, #{<<"include_docs">> => true}).

Map = maps:from_list([{<<"k">>,1},{<<"k1">>,1},{<<"k2">>,1}]).

{ok, DocsRes} = couchdb_databases:bulk_docs_save(Db, [Map]).


{ok,Db1} = couchdb:database_record(Server, <<"wst_host_similarweb_analytic">>).
{ok,L} = ssdb:query([hgetall,<<"wst_host_similarweb_analytic">>]).

All5 = [maps:from_list([{<<"_id">>,K},{<<"value">>,V}])||{K,V} <- L].

%% maps:put(<<"_id">>, <<"randomid">>, Doc0),
couchdb_databases:bulk_docs_save(Db1, All5).

http://127.0.0.1:5984/wst_host_similarweb_analytic/_all_docs?limit=11&include_docs=true&startkey=accounts.google.com%00

http://127.0.0.1:5984/wst_host_similarweb_analytic/accounts.kakao.com