############### old settings for terminal ###############
# old #PS1='\[\e[1;32m\]┌──(\u@\h)-[\w]\n└─>\[\e[0m\] '

# Function to get the current Git branch
#get_git_branch() {
#    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
#    if [ -n "$branch" ]; then
#        echo "⚙️  branch:$branch"
#    fi
#}
#PS1='\[\e[1;36m\]┌──{\u}-[\W]\[\e[1;30m\] ◀-----[\w]-----▶ {\D{ %r }}\n\[\e[1;36m\]└─> $(get_git_branch) \[\e[0m\] '
#PS1='\[\e[1;36m\]┌──{\u}-[\W]\[\e[1;30m\] ◀-----[\w]-----▶ {\D{ %r }}\n\[\e[1;36m\]└─> $(get_git_branch) \[\e[0m\] '

############### new settings for terminal ###############
get_git_branch() {
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        echo -e " ☢ $branch"
    else
        echo " "
    fi
}
#└
#PS1='\[\e[1;36m\]$(get_git_branch)(\W) > \[\e[0m\]'
PS1='\[\e[1;30m\]┌──(\W)$(get_git_branch)\n└\[\e[1;36m\]> \[\e[0m\]'

source ~/.bashrc
