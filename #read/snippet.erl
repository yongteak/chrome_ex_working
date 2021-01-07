Env = application:get_all_env(couchbeam).
Host = proplists:get_value(host,Env),
Port = proplists:get_value(port,Env),
Options = proplists:get_value(options,Env).
S = couchbeam:server_connection(Host, Port, "", Options).
{ok, _Version} = couchbeam:server_info(S).



Couch = boot_key_server:get(couch).
{ok, Db} = couchbeam:open_db(Couch, "category").

lists:foldl(fun(Key,Acc)->
    case couchbeam:open_doc(Db, Key) of
        {error,not_found} -> Acc ++[ [{<<"url">>,Key}] ];
        {ok,{Doc}} ->
            Code = boot_util:pget(<<"code">>,Doc),
            Votes = boot_util:pget(<<"votes">>,Doc),
            Exist = [ User ||{User}<-Votes, boot_util:pget(<<"user_id">>,User) =:= <<"xxx">>],
            Vote = case Exist of
                [E] -> E;
                _ -> []
            end,
            Acc ++ [ [{<<"url">> ,Key}, {<<"code">>,Code}, {<<"vote">>, Vote}] ]
        end
    end,[],[<<"test">>,<<"my_domain.com">>,<<"c">>,<<"your_domain.com">>]).

http://127.0.0.1:5984/wst_host_similarweb_analytic/_all_docs?limit=11&include_docs=true&startkey=accounts.google.com%00

http://127.0.0.1:5984/wst_host_similarweb_analytic/accounts.kakao.com