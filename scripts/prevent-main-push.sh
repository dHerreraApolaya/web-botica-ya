while read -r local_ref local_oid remote_ref remote_oid
do
  if [ "$remote_ref" = "refs/heads/main" ]; then
    printf '%s\n' 'Push bloqueado: main solo recibe cambios mediante pull request. Publica tu rama de trabajo y abre un PR.' >&2
    exit 1
  fi
done
exit 0
